<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use App\Services\ArtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArtController extends Controller
{
    public function __construct(private ArtService $service) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->getDashboard($request->user()));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'labels' => ['nullable', 'array', 'max:12'],
            'labels.*' => ['string', 'max:50'],
            'status' => ['sometimes', 'in:draft,published,archived'],
            'download_policy' => ['sometimes', 'string', 'in:disabled,free,paid'],
            'download_credits' => ['nullable', 'integer', 'min:1', 'max:999'],
            'apply_watermark' => ['sometimes', 'boolean'],
            'image' => ['required_without:images', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'images' => ['required_without:image', 'array', 'min:1', 'max:10'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'image_descriptions' => ['nullable', 'array', 'max:10'],
            'image_descriptions.*' => ['nullable', 'string', 'max:500'],
            'download_files' => ['nullable', 'array', 'max:10'],
            'download_files.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,zip', 'max:51200'],
        ]);

        $art = $this->service->createArt($request->user(), $validated, $request);

        return response()->json($art, 201);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        return response()->json($this->service->getOwnedArt($request->user(), $slug));
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $art = $this->service->getOwnedArt($request->user(), $slug);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'labels' => ['nullable', 'array', 'max:12'],
            'labels.*' => ['string', 'max:50'],
            'status' => ['sometimes', 'in:draft,published,archived'],
            'download_policy' => ['sometimes', 'string', 'in:disabled,free,paid'],
            'download_credits' => ['nullable', 'integer', 'min:1', 'max:999'],
            'apply_watermark' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'images' => ['nullable', 'array', 'min:1', 'max:10'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'image_descriptions' => ['nullable', 'array', 'max:10'],
            'image_descriptions.*' => ['nullable', 'string', 'max:500'],
            'download_files' => ['nullable', 'array', 'max:10'],
            'download_files.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,zip', 'max:51200'],
        ]);

        return response()->json($this->service->updateArt($art, $validated, $request));
    }

    public function destroy(Request $request, string $slug): JsonResponse
    {
        $art = $this->service->getOwnedArt($request->user(), $slug);
        $this->service->trashArt($art);

        return response()->json(['message' => 'Art moved to trash.']);
    }

    public function trash(Request $request): JsonResponse
    {
        return response()->json($this->service->getTrashedArts($request->user()));
    }

    public function restore(Request $request, string $slug): JsonResponse
    {
        $this->service->restoreArt($request->user(), $slug);

        return response()->json(['message' => 'Art restored.']);
    }

    public function forceDelete(Request $request, string $slug): JsonResponse
    {
        $this->service->forceDeleteArt($request->user(), $slug);

        return response()->json(['message' => 'Art permanently deleted.']);
    }
}
