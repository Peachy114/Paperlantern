<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Art;
use App\Models\ArtWatermark;
use App\Models\ArtWatermarkSetting;
use App\Models\ArtistSticker;
use App\Models\FeatureBoost;
use App\Models\ProfileBorder;
use App\Models\RoyaltyDesignAsset;
use App\Models\User;
use App\Services\ArtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ArtController extends Controller
{
    public function __construct(private ArtService $service) {}

    public function index(): JsonResponse
    {
        $arts = Art::query()
            ->select('arts.*')
            ->where('status', 'published')
            ->with(['images', 'user:id,name,username,role'])
            ->selectSub($this->activeBoostSubquery(), 'boosted_until')
            ->orderByRaw('CASE WHEN boosted_until IS NULL THEN 1 ELSE 0 END ASC')
            ->orderByDesc('boosted_until')
            ->orderByRaw('CASE WHEN public_sort_order IS NULL THEN 1 ELSE 0 END ASC')
            ->orderBy('public_sort_order')
            ->orderByDesc('views')
            ->latest()
            ->get();

        return response()->json($arts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'labels' => ['nullable', 'array', 'max:12'],
            'labels.*' => ['string', 'max:50'],
            'download_policy' => ['sometimes', 'string', 'in:disabled,free,paid'],
            'download_credits' => ['nullable', 'integer', 'min:1', 'max:999'],
            'apply_watermark' => ['sometimes', 'boolean'],
            'image' => ['required_without:images', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'images' => ['required_without:image', 'array', 'min:1', 'max:10'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'image_descriptions' => ['nullable', 'array', 'max:10'],
            'image_descriptions.*' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['status'] = 'published';
        $validated['moderation_status'] = 'approved';
        $validated['public_sort_order'] = ((int) Art::max('public_sort_order')) + 1;

        $art = $this->service->createArt($request->user(), $validated, $request);

        return response()->json($art->load(['images', 'user:id,name,username,role']), 201);
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'art_ids' => ['required', 'array'],
            'art_ids.*' => ['string', 'exists:arts,id'],
        ]);

        $boostedIds = FeatureBoost::where('target_type', 'art')
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now())
            ->pluck('target_id')
            ->all();

        $order = 1;
        foreach ($validated['art_ids'] as $artId) {
            if (in_array($artId, $boostedIds, true)) {
                continue;
            }

            Art::where('id', $artId)->update(['public_sort_order' => $order]);
            $order++;
        }

        return response()->json(['message' => 'Arts order updated.']);
    }

    public function featureArtist(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'exists:users,username'],
            'days' => ['required', 'integer', 'min:1', 'max:30'],
        ]);

        $artist = User::where('username', $validated['username'])
            ->where('role', 'storyteller')
            ->firstOrFail();

        $boost = FeatureBoost::create([
            'user_id' => $artist->id,
            'target_type' => 'artist_profile',
            'target_id' => $artist->id,
            'days' => $validated['days'],
            'credits_spent' => 0,
            'starts_at' => now(),
            'ends_at' => now()->addDays((int) $validated['days']),
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Artist featured.',
            'boost' => $boost,
        ], 201);
    }

    public function profileBorders(): JsonResponse
    {
        return response()->json(
            ProfileBorder::where('is_default', true)
                ->orderBy('sort_order')
                ->latest()
                ->get()
        );
    }

    public function storeProfileBorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['required', 'file', 'mimes:png,webp,gif', 'max:10240'],
            'subscription_free' => ['sometimes', 'boolean'],
            'publish_public' => ['sometimes', 'boolean'],
        ]);
        $publishPublic = $request->boolean('publish_public', true);

        $border = ProfileBorder::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_path' => $request->file('image')->store('profile-borders/defaults', 'public'),
            'is_default' => true,
            'is_public' => $publishPublic,
            'is_free' => true,
            'credit_cost' => 0,
            'subscription_free' => $request->boolean('subscription_free'),
            'published_at' => $publishPublic ? now() : null,
            'sort_order' => ((int) ProfileBorder::where('is_default', true)->max('sort_order')) + 1,
        ]);

        return response()->json($border, 201);
    }

    public function destroyProfileBorder(ProfileBorder $border): JsonResponse
    {
        abort_unless($border->is_default, 404);

        User::where('profile_border_id', $border->id)->update(['profile_border_id' => null]);
        $border->delete();

        return response()->json(['message' => 'Default profile border deleted.']);
    }

    public function stickers(): JsonResponse
    {
        return response()->json([
            'data' => ArtistSticker::query()
                ->with('user:id,name,username,role')
                ->withCount(['subscriptions', 'purchases'])
                ->whereHas('user', fn($q) => $q->where('role', 'super_admin'))
                ->orderBy('sort_order')
                ->latest()
                ->get(),
        ]);
    }

    public function storeSticker(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:80'],
            'sticker_names' => ['nullable', 'array', 'max:50'],
            'sticker_names.*' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'bundle_name' => ['nullable', 'string', 'max:120'],
            'is_free' => ['sometimes', 'boolean'],
            'credit_cost' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'subscription_free' => ['sometimes', 'boolean'],
            'publish_public' => ['sometimes', 'boolean'],
            'image' => ['required_without:images', 'file', 'mimes:png,webp,gif', 'max:10240'],
            'images' => ['required_without:image', 'array', 'min:1', 'max:50'],
            'images.*' => ['file', 'mimes:png,webp,gif', 'max:10240'],
        ]);
        $isFree = $request->boolean('is_free');
        $publishPublic = $request->boolean('publish_public', true);
        $files = $request->hasFile('images')
            ? $request->file('images')
            : [$request->file('image')];
        $stickerNames = $validated['sticker_names'] ?? [];
        $sortOrder = (int) ArtistSticker::where('user_id', $request->user()->id)->max('sort_order');

        $stickers = collect($files)
            ->filter()
            ->values()
            ->map(function ($file, int $index) use ($request, $validated, $stickerNames, $isFree, &$sortOrder) {
                $sortOrder++;
                $name = trim((string) ($stickerNames[$index] ?? $validated['name'] ?? ''))
                    ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

                return ArtistSticker::create([
                    'user_id' => $request->user()->id,
                    'name' => $name,
                    'description' => $validated['description'] ?? null,
                    'bundle_name' => $validated['bundle_name'] ?? null,
                    'is_free' => $isFree,
                    'credit_cost' => $isFree ? 0 : max(1, (int) ($validated['credit_cost'] ?? 1)),
                    'is_public' => $publishPublic,
                    'subscription_free' => $request->boolean('subscription_free'),
                    'published_at' => $publishPublic ? now() : null,
                    'image_path' => $file->store("artist-profiles/{$request->user()->id}/stickers", 'public'),
                    'sort_order' => $sortOrder,
                ])->load('user:id,name,username,role');
            });

        return response()->json(
            $stickers->count() === 1
                ? $stickers->first()
                : ['data' => $stickers, 'message' => "{$stickers->count()} stickers added."],
            201
        );
    }

    public function destroySticker(ArtistSticker $sticker): JsonResponse
    {
        abort_unless($sticker->user?->role === 'super_admin', 404);

        \Storage::disk('public')->delete($sticker->image_path);
        $sticker->delete();

        return response()->json(['message' => 'Default sticker deleted.']);
    }

    public function royaltyDesigns(string $type): JsonResponse
    {
        abort_unless(in_array($type, RoyaltyDesignAsset::TYPES, true), 404);

        return response()->json([
            'data' => RoyaltyDesignAsset::where('type', $type)
                ->orderBy('sort_order')
                ->latest()
                ->get(),
        ]);
    }

    public function storeRoyaltyDesign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(RoyaltyDesignAsset::TYPES)],
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'is_active' => ['sometimes', 'boolean'],
            'publish_public' => ['sometimes', 'boolean'],
            'subscription_free' => ['sometimes', 'boolean'],
            'style_settings' => ['nullable', 'json'],
        ]);
        $publishPublic = $request->boolean('publish_public', true);
        $styleSettings = isset($validated['style_settings'])
            ? json_decode($validated['style_settings'], true)
            : null;
        $source = is_array($styleSettings) ? ($styleSettings['design_source'] ?? 'image') : 'image';
        $simpleMessage = $validated['type'] === 'message_design' && $source === 'simple';

        if (! $simpleMessage && ! $request->hasFile('image')) {
            return response()->json(['message' => 'Image or GIF is required for this design type.'], 422);
        }

        $asset = RoyaltyDesignAsset::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_path' => $request->hasFile('image')
                ? $request->file('image')->store("royalty-designs/{$validated['type']}", 'public')
                : '',
            'is_active' => $request->boolean('is_active', true),
            'is_public' => $publishPublic,
            'subscription_free' => $request->boolean('subscription_free'),
            'style_settings' => is_array($styleSettings) ? $styleSettings : null,
            'published_at' => $publishPublic ? now() : null,
            'sort_order' => ((int) RoyaltyDesignAsset::where('type', $validated['type'])->max('sort_order')) + 1,
        ]);

        return response()->json($asset, 201);
    }

    public function destroyRoyaltyDesign(RoyaltyDesignAsset $asset): JsonResponse
    {
        if ($asset->image_path) {
            \Storage::disk('public')->delete($asset->image_path);
        }
        $asset->delete();

        return response()->json(['message' => 'Design asset deleted.']);
    }

    public function updateRoyaltyDesign(Request $request, RoyaltyDesignAsset $asset): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'is_active' => ['sometimes', 'boolean'],
            'publish_public' => ['sometimes', 'boolean'],
            'subscription_free' => ['sometimes', 'boolean'],
            'style_settings' => ['nullable', 'json'],
        ]);

        $styleSettings = isset($validated['style_settings'])
            ? json_decode($validated['style_settings'], true)
            : null;
        $source = is_array($styleSettings) ? ($styleSettings['design_source'] ?? 'image') : 'image';
        $simpleMessage = $asset->type === 'message_design' && $source === 'simple';

        if ($request->hasFile('image')) {
            if ($asset->image_path) {
                \Storage::disk('public')->delete($asset->image_path);
            }
            $asset->image_path = $request->file('image')->store("royalty-designs/{$asset->type}", 'public');
        }

        if (! $simpleMessage && ! $asset->image_path) {
            return response()->json(['message' => 'Image or GIF is required for this design type.'], 422);
        }

        $publishPublic = $request->boolean('publish_public', $asset->is_public);
        $asset->fill([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $request->boolean('is_active', $asset->is_active),
            'is_public' => $publishPublic,
            'subscription_free' => $request->boolean('subscription_free', $asset->subscription_free),
            'style_settings' => is_array($styleSettings) ? $styleSettings : null,
            'published_at' => $publishPublic ? ($asset->published_at ?? now()) : null,
        ]);
        $asset->save();

        return response()->json($asset);
    }

    public function watermarks(): JsonResponse
    {
        return response()->json([
            'watermarks' => ArtWatermark::orderBy('sort_order')->orderBy('created_at')->get(),
            'settings' => ArtWatermarkSetting::current(),
        ]);
    }

    public function storeWatermark(Request $request): JsonResponse
    {
        $validated = $this->validateWatermark($request, true);

        $watermark = ArtWatermark::create(array_merge($validated, [
            'image_path' => $request->file('image')->store('art-watermarks', 'public'),
            'sort_order' => $validated['sort_order']
                ?? ((int) ArtWatermark::max('sort_order')) + 1,
        ]));

        return response()->json($watermark, 201);
    }

    public function updateWatermark(Request $request, ArtWatermark $watermark): JsonResponse
    {
        $validated = $this->validateWatermark($request, false);

        if ($request->hasFile('image')) {
            \Storage::disk('public')->delete($watermark->image_path);
            $validated['image_path'] = $request->file('image')->store('art-watermarks', 'public');
        }

        $watermark->update($validated);

        return response()->json($watermark->fresh());
    }

    public function destroyWatermark(ArtWatermark $watermark): JsonResponse
    {
        \Storage::disk('public')->delete($watermark->image_path);
        $watermark->delete();

        return response()->json(['message' => 'Watermark deleted.']);
    }

    public function updateWatermarkSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'noise_enabled' => ['required', 'boolean'],
            'noise_opacity' => ['required', 'integer', 'min:1', 'max:30'],
            'noise_density' => ['required', 'integer', 'min:1', 'max:15'],
        ]);

        $settings = ArtWatermarkSetting::current();
        $settings->update($validated);

        return response()->json($settings->fresh());
    }

    private function activeBoostSubquery()
    {
        return FeatureBoost::query()
            ->selectRaw('MAX(ends_at)')
            ->whereColumn('target_id', 'arts.id')
            ->where('target_type', 'art')
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now());
    }

    private function validateWatermark(Request $request, bool $creating): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'image' => [$creating ? 'required' : 'nullable', 'file', 'mimes:png,webp,jpg,jpeg', 'max:10240'],
            'target' => ['required', 'string', 'in:arts,messages,final_delivery'],
            'position' => ['required', 'string', 'in:top-left,top,top-right,left,center,right,bottom-left,bottom,bottom-right'],
            'offset_x' => ['required', 'integer', 'min:0', 'max:1000'],
            'offset_y' => ['required', 'integer', 'min:0', 'max:1000'],
            'width_percent' => ['required', 'integer', 'min:3', 'max:80'],
            'opacity' => ['required', 'integer', 'min:1', 'max:100'],
            'rotation' => ['required', 'integer', 'min:-180', 'max:180'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ]);
    }
}
