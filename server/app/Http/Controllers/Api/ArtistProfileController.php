<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArtistProfileBlock;
use App\Models\ArtistSticker;
use App\Models\ProfileBorder;
use App\Services\ArtistProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArtistProfileController extends Controller
{
    public function __construct(private ArtistProfileService $service) {}

    public function show(string $username): JsonResponse
    {
        return response()->json($this->service->show($username));
    }

    public function updateHeader(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'artist_title' => ['nullable', 'string', 'max:100'],
            'cover' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'avatar' => ['nullable', 'image', 'max:10240'],
            'background_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'profile_cover_position_x' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'profile_cover_position_y' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'avatar_position_x' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'avatar_position_y' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'show_public_links' => ['sometimes', 'boolean'],
            'profile_background_color' => ['nullable', 'string', 'max:20'],
            'profile_background_gradient_from' => ['nullable', 'string', 'max:20'],
            'profile_background_gradient_to' => ['nullable', 'string', 'max:20'],
            'profile_background_gradient_direction' => ['sometimes', 'string', 'in:to top,to right,to bottom,to left,to top right,to bottom right,to bottom left,to top left'],
            'profile_background_blur' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'profile_banner_height' => ['sometimes', 'integer', 'min:160', 'max:560'],
            'profile_avatar_frame_x' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'profile_avatar_frame_y' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'profile_avatar_border_width' => ['sometimes', 'integer', 'min:0', 'max:16'],
            'profile_avatar_border_color' => ['nullable', 'string', 'max:20'],
            'profile_avatar_border_radius' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'profile_nav_layout' => ['sometimes', 'string', 'in:together,separate'],
            'profile_nav_x' => ['sometimes', 'numeric', 'min:-50', 'max:50'],
            'profile_nav_y' => ['sometimes', 'numeric', 'min:-80', 'max:200'],
            'profile_nav_w' => ['sometimes', 'numeric', 'min:30', 'max:100'],
            'profile_nav_h' => ['sometimes', 'integer', 'min:28', 'max:96'],
            'profile_board_min_height' => ['sometimes', 'integer', 'min:360', 'max:2400'],
            'profile_arts_tile_width' => ['sometimes', 'integer', 'min:120', 'max:420'],
            'profile_sticker_size' => ['sometimes', 'integer', 'min:72', 'max:180'],
            'profile_show_cover' => ['sometimes', 'boolean'],
            'profile_cover_width' => ['sometimes', 'integer', 'min:30', 'max:100'],
            'profile_background_has_gradient' => ['sometimes', 'boolean'],
            'profile_tabs_config' => ['nullable', 'string', 'max:12000'],
            'profile_links' => ['nullable', 'string', 'max:12000'],
            'profile_link_images' => ['nullable', 'array', 'max:12'],
            'profile_link_images.*' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
            'profile_border_id' => ['nullable', 'string', 'exists:profile_borders,id'],
        ]);

        return response()->json([
            'artist' => $this->service->updateHeader($request->user(), $validated, $request),
        ]);
    }

    public function storeBlock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:image,text'],
            'text_content' => ['required_if:type,text', 'nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'source_art_image_id' => ['nullable', 'string', 'exists:art_images,id'],
            'source_sticker_id' => ['nullable', 'string', 'exists:artist_stickers,id'],
            'is_sticker' => ['sometimes', 'boolean'],
            'width' => ['sometimes', 'in:small,medium,large,full'],
            'height' => ['sometimes', 'in:auto,short,medium,tall'],
            'x' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'y' => ['sometimes', 'numeric', 'min:0', 'max:999'],
            'w' => ['sometimes', 'numeric', 'min:5', 'max:100'],
            'h' => ['sometimes', 'numeric', 'min:5', 'max:999'],
            'padding_x' => ['sometimes', 'integer', 'min:0', 'max:40'],
            'padding_y' => ['sometimes', 'integer', 'min:0', 'max:40'],
            'fit_mode' => ['sometimes', 'in:contain,cover,stretch'],
            'font_size' => ['sometimes', 'integer', 'min:10', 'max:96'],
            'z_index' => ['sometimes', 'integer', 'min:1', 'max:999'],
            'rotation' => ['sometimes', 'numeric', 'min:-360', 'max:360'],
            'background_color' => ['nullable', 'string', 'max:20'],
            'transparent_background' => ['sometimes', 'boolean'],
            'overlay' => ['sometimes', 'boolean'],
            'show_border' => ['sometimes', 'boolean'],
            'border_color' => ['nullable', 'string', 'max:20'],
            'border_radius' => ['sometimes', 'integer', 'min:0', 'max:200'],
            'font_family' => ['nullable', 'string', 'max:120'],
            'font_color' => ['nullable', 'string', 'max:20'],
            'locked' => ['sometimes', 'boolean'],
            'image_position_x' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'image_position_y' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ]);

        return response()->json($this->service->createBlock($request->user(), $validated, $request), 201);
    }

    public function updateBlock(Request $request, ArtistProfileBlock $block): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['sometimes', 'in:image,text'],
            'text_content' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'source_art_image_id' => ['nullable', 'string', 'exists:art_images,id'],
            'source_sticker_id' => ['nullable', 'string', 'exists:artist_stickers,id'],
            'is_sticker' => ['sometimes', 'boolean'],
            'width' => ['sometimes', 'in:small,medium,large,full'],
            'height' => ['sometimes', 'in:auto,short,medium,tall'],
            'x' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'y' => ['sometimes', 'numeric', 'min:0', 'max:999'],
            'w' => ['sometimes', 'numeric', 'min:5', 'max:100'],
            'h' => ['sometimes', 'numeric', 'min:5', 'max:999'],
            'padding_x' => ['sometimes', 'integer', 'min:0', 'max:40'],
            'padding_y' => ['sometimes', 'integer', 'min:0', 'max:40'],
            'fit_mode' => ['sometimes', 'in:contain,cover,stretch'],
            'font_size' => ['sometimes', 'integer', 'min:10', 'max:96'],
            'z_index' => ['sometimes', 'integer', 'min:1', 'max:999'],
            'rotation' => ['sometimes', 'numeric', 'min:-360', 'max:360'],
            'background_color' => ['nullable', 'string', 'max:20'],
            'transparent_background' => ['sometimes', 'boolean'],
            'overlay' => ['sometimes', 'boolean'],
            'show_border' => ['sometimes', 'boolean'],
            'border_color' => ['nullable', 'string', 'max:20'],
            'border_radius' => ['sometimes', 'integer', 'min:0', 'max:200'],
            'font_family' => ['nullable', 'string', 'max:120'],
            'font_color' => ['nullable', 'string', 'max:20'],
            'locked' => ['sometimes', 'boolean'],
            'image_position_x' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'image_position_y' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ]);

        return response()->json($this->service->updateBlock($request->user(), $block, $validated, $request));
    }

    public function destroyBlock(Request $request, ArtistProfileBlock $block): JsonResponse
    {
        $this->service->deleteBlock($request->user(), $block);

        return response()->json(['message' => 'Profile block deleted.']);
    }

    public function reorderBlocks(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'blocks' => ['required', 'array'],
            'blocks.*.id' => ['required', 'string'],
            'blocks.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $this->service->reorderBlocks($request->user(), $validated['blocks']);

        return response()->json(['message' => 'Profile blocks reordered.']);
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
        $validated['is_free'] = $isFree;
        $validated['credit_cost'] = $isFree ? 0 : max(1, (int) ($validated['credit_cost'] ?? 1));
        $stickerNames = $validated['sticker_names'] ?? [];
        unset($validated['image'], $validated['images'], $validated['sticker_names']);

        $files = $request->hasFile('images')
            ? $request->file('images')
            : [$request->file('image')];

        $stickers = collect($files)
            ->filter()
            ->values()
            ->map(function ($file, int $index) use ($request, $validated, $stickerNames) {
                $payload = $validated;
                $payload['name'] = trim((string) ($stickerNames[$index] ?? $validated['name'] ?? ''))
                    ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $payload['description'] = $validated['description'] ?? null;

                return $this->service->createSticker($request->user(), $payload, $request, $file);
            });

        return response()->json(
            $stickers->count() === 1
                ? $stickers->first()
                : ['data' => $stickers, 'message' => "{$stickers->count()} stickers added."],
            201
        );
    }

    public function storeBorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:80'],
            'image' => ['required', 'file', 'mimes:png,webp,gif', 'max:10240'],
            'publish_public' => ['sometimes', 'boolean'],
        ]);

        return response()->json($this->service->createBorder($request->user(), $validated, $request), 201);
    }

    public function destroyBorder(Request $request, ProfileBorder $border): JsonResponse
    {
        $this->service->deleteBorder($request->user(), $border);

        return response()->json(['message' => 'Profile border deleted.']);
    }

    public function stickers(Request $request): JsonResponse
    {
        return response()->json($this->service->stickerLibrary($request->user()));
    }

    public function destroySticker(Request $request, ArtistSticker $sticker): JsonResponse
    {
        $this->service->deleteSticker($request->user(), $sticker);

        return response()->json(['message' => 'Sticker deleted.']);
    }
}
