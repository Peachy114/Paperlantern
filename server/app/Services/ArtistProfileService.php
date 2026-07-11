<?php

namespace App\Services;

use App\Models\Art;
use App\Models\ArtImage;
use App\Models\ArtistProfileBlock;
use App\Models\ArtistSticker;
use App\Models\Comment;
use App\Models\ProfileBorder;
use App\Models\User;
use App\Models\Work;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ArtistProfileService
{
    public function __construct(private ContentSuspensionService $contentSuspensions) {}

    public function show(string $username): array
    {
        $artist = User::where('username', $username)
            ->where('role', '!=', 'super_admin')
            ->firstOrFail();

        $stickerLibrary = $this->stickerLibrary($artist);

        return [
            'artist' => $this->formatArtist($artist),
            'borders' => $this->availableBorders($artist),
            'blocks' => $artist->artistProfileBlocks()
                ->with(['sourceArtImage', 'sourceSticker'])
                ->whereDoesntHave('activeContentSuspensions', fn($query) => $query->whereNull('target_field'))
                ->orderBy('sort_order')
                ->get(),
            'stickers' => collect($stickerLibrary['owned'])
                ->merge($stickerLibrary['subscribed'])
                ->merge($stickerLibrary['bought'])
                ->unique('id')
                ->values(),
            'arts' => Art::where('user_id', $artist->id)
                ->where('status', 'published')
                ->whereDoesntHave('activeContentSuspensions', fn($query) => $query->whereNull('target_field'))
                ->with([
                    'activeContentSuspensions',
                    'images' => fn($query) => $query->whereDoesntHave('activeContentSuspensions', fn($inner) => $inner->whereNull('target_field')),
                    'images.activeContentSuspensions',
                ])
                ->latest()
                ->get()
                ->map(fn(Art $art) => $this->contentSuspensions->maskArt($art)),
            'works' => Work::where('user_id', $artist->id)
                ->where('status', '!=', 'draft')
                ->where('moderation_status', '!=', 'violated')
                ->whereDoesntHave('activeContentSuspensions', fn($query) => $query->whereNull('target_field'))
                ->with('activeContentSuspensions')
                ->withCount(['chapters' => fn($query) => $query->where('status', '!=', 'draft')])
                ->latest()
                ->get(['id', 'slug', 'title', 'description', 'type', 'genres', 'cover', 'status', 'views', 'likes', 'created_at'])
                ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work)),
            'comments' => Comment::where('user_id', $artist->id)
                ->where('status', 'visible')
                ->where('public_highlight', true)
                ->with(['commentable', 'sticker'])
                ->latest()
                ->limit(24)
                ->get()
                ->map(fn(Comment $comment) => $this->formatPublicComment($comment))
                ->values(),
        ];
    }

    public function updateHeader(User $user, array $validated, Request $request): array
    {
        if ($request->hasFile('cover')) {
            if ($user->profile_cover) {
                Storage::disk('public')->delete($user->profile_cover);
            }
            $validated['profile_cover'] = $request->file('cover')->store("artist-profiles/{$user->id}", 'public');
        }
        unset($validated['cover']);

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }
        unset($validated['avatar']);

        if ($request->hasFile('background_image')) {
            if ($user->profile_background_image) {
                Storage::disk('public')->delete($user->profile_background_image);
            }
            $validated['profile_background_image'] = $request->file('background_image')->store("artist-profiles/{$user->id}/backgrounds", 'public');
        }
        unset($validated['background_image']);

        if (array_key_exists('profile_tabs_config', $validated)) {
            $validated['profile_tabs_config'] = $this->normalizeTabsConfig($validated['profile_tabs_config']);
        }

        if (array_key_exists('profile_links', $validated)) {
            $validated['profile_links'] = $this->normalizeProfileLinks($user, $validated['profile_links'], $request);
        }

        if (!empty($validated['profile_border_id'])) {
            $validated['profile_border_id'] = $this->findUsableBorder($user, $validated['profile_border_id'])->id;
        }

        $user->update($validated);

        return $this->formatArtist($user->fresh());
    }

    public function createBlock(User $user, array $validated, Request $request): ArtistProfileBlock
    {
        $this->prepareImageSource($user, $validated, $request);

        if (($validated['type'] ?? null) === 'image' && !$this->hasImageSource($validated)) {
            throw ValidationException::withMessages([
                'image' => ['Choose an uploaded image, image from My Arts, or sticker.'],
            ]);
        }

        if (($validated['type'] ?? null) === 'text') {
            $validated['image_path'] = null;
            $validated['image_url'] = null;
            $validated['source_art_image_id'] = null;
            $validated['source_sticker_id'] = null;
            $validated['is_sticker'] = false;
        }

        $validated['sort_order'] = (int) $user->artistProfileBlocks()->max('sort_order') + 1;

        return $user->artistProfileBlocks()->create($validated)->load(['sourceArtImage', 'sourceSticker']);
    }

    public function updateBlock(User $user, ArtistProfileBlock $block, array $validated, Request $request): ArtistProfileBlock
    {
        abort_unless($block->user_id === $user->id, 403);

        $this->prepareImageSource($user, $validated, $request, $block);

        if (($validated['type'] ?? $block->type) === 'text') {
            if ($block->image_path) {
                Storage::disk('public')->delete($block->image_path);
            }
            $validated['image_path'] = null;
            $validated['image_url'] = null;
            $validated['source_art_image_id'] = null;
            $validated['source_sticker_id'] = null;
            $validated['is_sticker'] = false;
        }

        $block->update($validated);

        return $block->fresh()->load(['sourceArtImage', 'sourceSticker']);
    }

    public function deleteBlock(User $user, ArtistProfileBlock $block): void
    {
        abort_unless($block->user_id === $user->id, 403);

        if ($block->image_path) {
            Storage::disk('public')->delete($block->image_path);
        }

        $block->delete();
    }

    public function reorderBlocks(User $user, array $blocks): void
    {
        foreach ($blocks as $block) {
            ArtistProfileBlock::where('user_id', $user->id)
                ->where('id', $block['id'])
                ->update(['sort_order' => $block['sort_order']]);
        }
    }

    public function createSticker(User $user, array $validated, Request $request): ArtistSticker
    {
        $validated['image_path'] = $request->file('image')->store("artist-profiles/{$user->id}/stickers", 'public');
        $validated['sort_order'] = (int) $user->artistStickers()->max('sort_order') + 1;

        return $user->artistStickers()->create($validated);
    }

    public function stickerLibrary(User $user): array
    {
        $owned = $user->artistStickers()
            ->with('user')
            ->withCount(['subscriptions', 'purchases'])
            ->latest()
            ->get()
            ->map(fn(ArtistSticker $sticker) => $this->formatSticker($sticker, 'created'));

        $subscribed = $user->subscribedArtistStickers()
            ->with('user')
            ->withCount(['subscriptions', 'purchases'])
            ->latest('artist_sticker_subscriptions.created_at')
            ->get()
            ->map(fn(ArtistSticker $sticker) => $this->formatSticker($sticker, 'subscribed'));

        $bought = $user->purchasedArtistStickers()
            ->with('user')
            ->withCount(['subscriptions', 'purchases'])
            ->latest('artist_sticker_purchases.created_at')
            ->get()
            ->map(fn(ArtistSticker $sticker) => $this->formatSticker($sticker, 'bought'));

        return [
            'stats' => [
                'total' => $owned->count() + $subscribed->count() + $bought->count(),
                'created' => $owned->count(),
                'subscribed' => $subscribed->count(),
                'bought' => $bought->count(),
            ],
            'owned' => $owned,
            'subscribed' => $subscribed,
            'bought' => $bought,
        ];
    }

    public function deleteSticker(User $user, ArtistSticker $sticker): void
    {
        abort_unless($sticker->user_id === $user->id, 403);

        Storage::disk('public')->delete($sticker->image_path);
        $sticker->delete();
    }

    public function createBorder(User $user, array $validated, Request $request): ProfileBorder
    {
        $validated['user_id'] = $user->id;
        $validated['image_path'] = $request->file('image')->store("artist-profiles/{$user->id}/borders", 'public');
        $validated['sort_order'] = (int) $user->profileBorders()->max('sort_order') + 1;

        return ProfileBorder::create($validated);
    }

    public function deleteBorder(User $user, ProfileBorder $border): void
    {
        abort_unless($border->user_id === $user->id, 403);

        User::where('profile_border_id', $border->id)->update(['profile_border_id' => null]);
        $border->delete();
    }

    private function prepareImageSource(
        User $user,
        array &$validated,
        Request $request,
        ?ArtistProfileBlock $block = null
    ): void {
        if ($request->hasFile('image')) {
            if ($block?->image_path) {
                Storage::disk('public')->delete($block->image_path);
            }
            $validated['image_path'] = $request->file('image')->store("artist-profiles/{$user->id}/blocks", 'public');
            $validated['image_url'] = null;
            $validated['source_art_image_id'] = null;
            $validated['source_sticker_id'] = null;
        }
        unset($validated['image']);

        if (!empty($validated['source_art_image_id'])) {
            $source = ArtImage::where('id', $validated['source_art_image_id'])
                ->whereHas('art', fn($query) => $query->where('user_id', $user->id))
                ->firstOrFail();

            if ($block?->image_path) {
                Storage::disk('public')->delete($block->image_path);
            }

            $validated['image_path'] = null;
            $validated['image_url'] = null;
            $validated['source_art_image_id'] = $source->id;
            $validated['source_sticker_id'] = null;
        }

        if (!empty($validated['source_sticker_id'])) {
            $source = $this->findUsableSticker($user, $validated['source_sticker_id']);

            if ($block?->image_path) {
                Storage::disk('public')->delete($block->image_path);
            }

            $validated['image_path'] = null;
            $validated['image_url'] = null;
            $validated['source_art_image_id'] = null;
            $validated['source_sticker_id'] = $source->id;
        }

        if (!empty($validated['image_url'])) {
            if ($block?->image_path) {
                Storage::disk('public')->delete($block->image_path);
            }
            $validated['image_path'] = null;
            $validated['source_art_image_id'] = null;
            $validated['source_sticker_id'] = null;
        }
    }

    private function hasImageSource(array $validated): bool
    {
        return !empty($validated['image_path'])
            || !empty($validated['image_url'])
            || !empty($validated['source_art_image_id'])
            || !empty($validated['source_sticker_id']);
    }

    private function formatArtist(User $artist): array
    {
        return [
            'id' => $artist->id,
            'name' => $artist->name,
            'username' => $artist->username,
            'role' => $artist->role,
            'avatar' => $artist->avatar,
            'profile_cover' => $artist->profile_cover,
            'artist_title' => $artist->artist_title,
            'profile_cover_position_x' => $artist->profile_cover_position_x,
            'profile_cover_position_y' => $artist->profile_cover_position_y,
            'avatar_position_x' => $artist->avatar_position_x,
            'avatar_position_y' => $artist->avatar_position_y,
            'show_public_links' => (bool) $artist->show_public_links,
            'profile_background_color' => $artist->profile_background_color,
            'profile_background_gradient_from' => $artist->profile_background_gradient_from,
            'profile_background_gradient_to' => $artist->profile_background_gradient_to,
            'profile_background_gradient_direction' => $artist->profile_background_gradient_direction,
            'profile_background_image' => $artist->profile_background_image,
            'profile_background_blur' => (int) ($artist->profile_background_blur ?? 0),
            'profile_banner_height' => (int) ($artist->profile_banner_height ?? 288),
            'profile_avatar_frame_x' => $artist->profile_avatar_frame_x ?? 50,
            'profile_avatar_frame_y' => $artist->profile_avatar_frame_y ?? 100,
            'profile_avatar_border_width' => (int) ($artist->profile_avatar_border_width ?? 4),
            'profile_avatar_border_color' => $artist->profile_avatar_border_color,
            'profile_avatar_border_radius' => (int) ($artist->profile_avatar_border_radius ?? 100),
            'profile_nav_layout' => $artist->profile_nav_layout ?? 'together',
            'profile_nav_x' => $artist->profile_nav_x ?? 0,
            'profile_nav_y' => $artist->profile_nav_y ?? 0,
            'profile_nav_w' => $artist->profile_nav_w ?? 100,
            'profile_nav_h' => (int) ($artist->profile_nav_h ?? 32),
            'profile_board_min_height' => (int) ($artist->profile_board_min_height ?? 760),
            'profile_arts_tile_width' => (int) ($artist->profile_arts_tile_width ?? 220),
            'profile_sticker_size' => (int) ($artist->profile_sticker_size ?? 112),
            'profile_show_cover' => (bool) ($artist->profile_show_cover ?? true),
            'profile_cover_width' => (int) ($artist->profile_cover_width ?? 100),
            'profile_background_has_gradient' => (bool) ($artist->profile_background_has_gradient ?? false),
            'profile_tabs_config' => $this->normalizeTabsConfig($artist->profile_tabs_config),
            'profile_links' => $this->normalizeProfileLinksForOutput($artist->profile_links),
            'profile_border_id' => $artist->profile_border_id,
            'profile_border' => $artist->profile_border_id
                ? $this->formatBorder($artist->selectedProfileBorder()->first())
                : null,
            'bio' => $artist->bio,
            'twitter_url' => $artist->twitter_url,
            'instagram_url' => $artist->instagram_url,
            'tiktok_url' => $artist->tiktok_url,
        ];
    }

    private function findUsableSticker(User $user, string $stickerId): ArtistSticker
    {
        $sticker = ArtistSticker::findOrFail($stickerId);

        $canUse = $sticker->user_id === $user->id
            || $user->subscribedArtistStickers()->where('artist_stickers.id', $stickerId)->exists()
            || $user->purchasedArtistStickers()->where('artist_stickers.id', $stickerId)->exists();

        abort_unless($canUse, 403);

        return $sticker;
    }

    private function findUsableBorder(User $user, string $borderId): ProfileBorder
    {
        $border = ProfileBorder::findOrFail($borderId);

        abort_unless($border->is_default || $border->user_id === $user->id, 403);

        return $border;
    }

    private function availableBorders(User $user): array
    {
        return ProfileBorder::query()
            ->where(fn($query) => $query
                ->where('is_default', true)
                ->orWhere('user_id', $user->id))
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->latest()
            ->get()
            ->map(fn(ProfileBorder $border) => $this->formatBorder($border))
            ->values()
            ->all();
    }

    private function normalizeTabsConfig(mixed $value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (!is_array($decoded)) {
                throw ValidationException::withMessages([
                    'profile_tabs_config' => ['Tabs configuration is invalid.'],
                ]);
            }
            $value = $decoded;
        }

        if (!is_array($value)) {
            $value = [];
        }

        $defaults = $this->defaultTabsConfig();
        $visibility = array_merge($defaults['visibility'], $value['visibility'] ?? []);
        $positions = $defaults['positions'];

        foreach (($value['positions'] ?? []) as $key => $position) {
            if (!array_key_exists($key, $positions) || !is_array($position)) {
                continue;
            }

            $positions[$key] = [
                'x' => $this->clampNumber($position['x'] ?? $positions[$key]['x'], 0, 90),
                'y' => $this->clampNumber($position['y'] ?? $positions[$key]['y'], 0, 220),
                'w' => $this->clampNumber($position['w'] ?? $positions[$key]['w'], 10, 100),
                'h' => $this->clampNumber($position['h'] ?? $positions[$key]['h'], 28, 96),
            ];
        }

        $sectionMode = $value['section_mode'] ?? $defaults['section_mode'];
        if (!in_array($sectionMode, [
            'separate_pages',
            'board_arts',
            'board_stickers',
            'board_arts_stickers',
        ], true)) {
            $sectionMode = $defaults['section_mode'];
        }

        return [
            'visibility' => [
                'board' => (bool) ($visibility['board'] ?? true),
                'arts' => (bool) ($visibility['arts'] ?? true),
                'works' => (bool) ($visibility['works'] ?? true),
                'stickers' => (bool) ($visibility['stickers'] ?? true),
                'comments' => (bool) ($visibility['comments'] ?? true),
            ],
            'section_mode' => $sectionMode,
            'positions' => $positions,
            'buttons' => $this->normalizeCanvasItems($value['buttons'] ?? null, $defaults['buttons'], 'tab'),
            'sections' => $this->normalizeCanvasItems($value['sections'] ?? null, $defaults['sections'], 'section'),
            'cover_offset' => [
                'x' => $this->clampNumber($value['cover_offset']['x'] ?? 0, -320, 320),
                'y' => $this->clampNumber($value['cover_offset']['y'] ?? 0, -180, 180),
            ],
            'border_offset' => [
                'x' => $this->clampNumber($value['border_offset']['x'] ?? 0, -80, 80),
                'y' => $this->clampNumber($value['border_offset']['y'] ?? 0, -80, 80),
            ],
        ];
    }

    private function defaultTabsConfig(): array
    {
        return [
            'visibility' => [
                'board' => false,
                'arts' => true,
                'works' => true,
                'stickers' => true,
                'comments' => false,
            ],
            'section_mode' => 'separate_pages',
            'positions' => [
                'board' => ['x' => 0, 'y' => 0, 'w' => 22, 'h' => 36],
                'arts' => ['x' => 0, 'y' => 0, 'w' => 28, 'h' => 36],
                'works' => ['x' => 30, 'y' => 0, 'w' => 28, 'h' => 36],
                'stickers' => ['x' => 60, 'y' => 0, 'w' => 32, 'h' => 36],
                'comments' => ['x' => 30, 'y' => 52, 'w' => 30, 'h' => 36],
            ],
            'buttons' => [
                ['id' => 'tab-arts', 'type' => 'arts', 'kind' => 'tab', 'page' => 'arts', 'display' => 'grid', 'pagination' => true, 'x' => 0, 'y' => 0, 'w' => 28, 'h' => 36],
                ['id' => 'tab-works', 'type' => 'works', 'kind' => 'tab', 'page' => 'works', 'display' => 'grid', 'pagination' => true, 'x' => 30, 'y' => 0, 'w' => 28, 'h' => 36],
                ['id' => 'tab-stickers', 'type' => 'stickers', 'kind' => 'tab', 'page' => 'stickers', 'display' => 'grid', 'pagination' => true, 'x' => 60, 'y' => 0, 'w' => 32, 'h' => 36],
            ],
            'sections' => [
                ['id' => 'section-arts', 'type' => 'arts', 'kind' => 'section', 'page' => 'arts', 'display' => 'masonry', 'pagination' => true, 'x' => 5, 'y' => 120, 'w' => 90, 'h' => 420],
                ['id' => 'section-works', 'type' => 'works', 'kind' => 'section', 'page' => 'works', 'display' => 'image_title', 'pagination' => true, 'x' => 5, 'y' => 120, 'w' => 90, 'h' => 420],
                ['id' => 'section-stickers', 'type' => 'stickers', 'kind' => 'section', 'page' => 'stickers', 'display' => 'grid', 'pagination' => true, 'x' => 5, 'y' => 120, 'w' => 90, 'h' => 420],
            ],
            'cover_offset' => ['x' => 0, 'y' => 0],
            'border_offset' => ['x' => 0, 'y' => 0],
        ];
    }

    private function normalizeCanvasItems(mixed $items, array $defaults, string $kind): array
    {
        $allowedTypes = ['board', 'arts', 'works', 'stickers', 'comments'];
        $allowedDisplays = [
            'grid',
            'masonry',
            'pinterest',
            'instagram',
            'carousel',
            'row',
            'image',
            'image_title',
            'split_card',
            'table',
            'cards',
        ];
        if ($items === null) {
            $items = $defaults;
        } elseif (!is_array($items)) {
            $items = [];
        }

        return collect($items)
            ->filter(fn($item) => is_array($item)
                && ($item['kind'] ?? null) === $kind
                && in_array(($item['type'] ?? null), $allowedTypes, true))
            ->values()
            ->map(fn($item, $index) => [
                'id' => (string) ($item['id'] ?? "{$kind}-{$item['type']}-{$index}"),
                'type' => (string) $item['type'],
                'kind' => $kind,
                'page' => in_array(($item['page'] ?? null), $allowedTypes, true)
                    ? (string) $item['page']
                    : (string) $item['type'],
                'display' => in_array(($item['display'] ?? null), $allowedDisplays, true)
                    ? (string) $item['display']
                    : $this->defaultCanvasDisplay((string) ($item['type'] ?? 'board')),
                'pagination' => array_key_exists('pagination', $item)
                    ? (bool) $item['pagination']
                    : true,
                'x' => $this->clampNumber($item['x'] ?? 0, 0, 95),
                'y' => $this->clampNumber($item['y'] ?? 0, 0, 2400),
                'w' => $this->clampNumber($item['w'] ?? 30, $kind === 'tab' ? 10 : 5, 100),
                'h' => $this->clampNumber($item['h'] ?? ($kind === 'tab' ? 36 : 420), $kind === 'tab' ? 28 : 80, 1400),
            ])
            ->all();
    }

    private function defaultCanvasDisplay(string $type): string
    {
        return match ($type) {
            'arts' => 'masonry',
            'works' => 'image_title',
            'comments' => 'table',
            default => 'grid',
        };
    }

    private function normalizeProfileLinks(User $user, ?string $json, Request $request): array
    {
        $decoded = json_decode($json ?: '[]', true);
        if (!is_array($decoded)) {
            throw ValidationException::withMessages([
                'profile_links' => ['Links configuration is invalid.'],
            ]);
        }

        $files = $request->file('profile_link_images', []);
        $links = [];

        foreach (array_slice($decoded, 0, 12) as $index => $link) {
            if (!is_array($link)) {
                continue;
            }

            $title = trim((string) ($link['title'] ?? ''));
            $url = trim((string) ($link['url'] ?? ''));
            if ($title === '' && $url === '') {
                continue;
            }

            if ($title === '') {
                throw ValidationException::withMessages([
                    'profile_links' => ['Each public link needs a title.'],
                ]);
            }

            if (!filter_var($url, FILTER_VALIDATE_URL)) {
                throw ValidationException::withMessages([
                    'profile_links' => ['Each public link needs a valid URL.'],
                ]);
            }

            $imagePath = $link['image_path'] ?? null;
            if (isset($files[$index])) {
                if ($imagePath) {
                    Storage::disk('public')->delete($imagePath);
                }
                $imagePath = $files[$index]->store("artist-profiles/{$user->id}/links", 'public');
            }

            $links[] = [
                'id' => (string) ($link['id'] ?? Str::uuid()),
                'title' => Str::limit($title, 80, ''),
                'url' => $url,
                'image_path' => $imagePath,
                'is_public' => (bool) ($link['is_public'] ?? true),
            ];
        }

        return $links;
    }

    private function normalizeProfileLinksForOutput(mixed $value): array
    {
        return collect(is_array($value) ? $value : [])
            ->filter(fn($link) => is_array($link) && !empty($link['title']) && !empty($link['url']))
            ->map(fn($link) => [
                'id' => (string) ($link['id'] ?? Str::uuid()),
                'title' => (string) $link['title'],
                'url' => (string) $link['url'],
                'image_path' => $link['image_path'] ?? null,
                'is_public' => (bool) ($link['is_public'] ?? true),
            ])
            ->values()
            ->all();
    }

    private function clampNumber(mixed $value, float $min, float $max): float
    {
        return min(max((float) $value, $min), $max);
    }

    private function formatPublicComment(Comment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'created_at' => $comment->created_at,
            'origin' => $this->formatCommentOrigin($comment->commentable),
            'sticker' => $comment->sticker ? [
                'id' => $comment->sticker->id,
                'name' => $comment->sticker->name,
                'image_path' => $comment->sticker->image_path,
            ] : null,
        ];
    }

    private function formatCommentOrigin(mixed $target): array
    {
        if ($target instanceof Work) {
            return [
                'type' => 'work',
                'title' => $target->title,
                'href' => "/works/{$target->slug}",
            ];
        }

        if ($target instanceof \App\Models\Chapter) {
            $target->loadMissing('work:id,slug,title');

            return [
                'type' => 'chapter',
                'title' => $target->title,
                'href' => $target->work ? "/works/{$target->work->slug}/chapters/{$target->slug}" : null,
            ];
        }

        if ($target instanceof Art) {
            return [
                'type' => 'art',
                'title' => $target->title,
                'href' => '/explore/arts',
            ];
        }

        return [
            'type' => 'unknown',
            'title' => 'Unknown',
            'href' => null,
        ];
    }

    private function formatSticker(ArtistSticker $sticker, string $status): array
    {
        return [
            'id' => $sticker->id,
            'user_id' => $sticker->user_id,
            'name' => $sticker->name,
            'image_path' => $sticker->image_path,
            'sort_order' => $sticker->sort_order,
            'subscriptions_count' => (int) ($sticker->subscriptions_count ?? 0),
            'purchases_count' => (int) ($sticker->purchases_count ?? 0),
            'library_status' => $status,
            'owner' => $sticker->relationLoaded('user') && $sticker->user
                ? [
                    'id' => $sticker->user->id,
                    'name' => $sticker->user->name,
                    'username' => $sticker->user->username,
                    'avatar' => $sticker->user->avatar,
                ]
                : null,
            'created_at' => $sticker->created_at,
            'updated_at' => $sticker->updated_at,
        ];
    }

    private function formatBorder(?ProfileBorder $border): ?array
    {
        if (! $border) {
            return null;
        }

        return [
            'id' => $border->id,
            'user_id' => $border->user_id,
            'name' => $border->name,
            'image_path' => $border->image_path,
            'is_default' => (bool) $border->is_default,
            'sort_order' => $border->sort_order,
            'created_at' => $border->created_at,
            'updated_at' => $border->updated_at,
        ];
    }
}
