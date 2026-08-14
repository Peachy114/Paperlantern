<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\AnnouncementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    private const PAGE_TARGETS = 'home,comix,novels,arts,commissions,shop,daily,rankings,genre,my_studio,my_arts,my_commission,my_shop';

    public function __construct(private AnnouncementService $service) {}

    // GET /api/admin/announcements
    public function index(): JsonResponse
    {
        return response()->json($this->service->getAll());
    }

    // POST /api/admin/announcements
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'    => ['required', 'string', 'max:255'],
            'content'  => ['required', 'string'],
            'format' => ['required', 'in:short,long,comic'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body_html' => ['nullable', 'required_if:format,long', 'string', 'max:100000'],
            'tag'      => ['required', 'in:event,update,reminder'],
            'is_event' => ['boolean'],
            'audience' => ['required', 'in:public,artist,studio'],
            'page_targets' => ['nullable', 'array'],
            'page_targets.*' => ['string', 'in:' . self::PAGE_TARGETS],
            'placement' => ['nullable', 'in:banner,hero,both'],
            'is_public' => ['boolean'],
            'image'    => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'gallery_images' => ['nullable', 'array', 'max:10'],
            'gallery_images.*' => ['image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'is_pinned'=> ['boolean'],
            'rotation_seconds' => ['nullable', 'integer', 'min:0', 'max:300'],
        ]);

        $announcement = $this->service->create(
            $request->user()->id,
            collect($validated)->except(['image', 'gallery_images'])->toArray(),
            $request->file('image'),
            $request->file('gallery_images', []),
        );

        return response()->json($announcement, 201);
    }

    // PUT /api/admin/announcements/{announcement}
    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $validated = $request->validate([
            'title'    => ['sometimes', 'string', 'max:255'],
            'content'  => ['sometimes', 'string'],
            'format' => ['sometimes', 'in:short,long,comic'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body_html' => ['nullable', 'string', 'max:100000'],
            'tag'      => ['sometimes', 'in:event,update,reminder'],
            'is_event' => ['boolean'],
            'audience' => ['sometimes', 'in:public,artist,studio'],
            'page_targets' => ['nullable', 'array'],
            'page_targets.*' => ['string', 'in:' . self::PAGE_TARGETS],
            'placement' => ['nullable', 'in:banner,hero,both'],
            'is_public' => ['boolean'],
            'image'    => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'gallery_images' => ['nullable', 'array', 'max:10'],
            'gallery_images.*' => ['image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'is_pinned'=> ['boolean'],
            'rotation_seconds' => ['nullable', 'integer', 'min:0', 'max:300'],
        ]);

        $announcement = $this->service->update(
            $announcement,
            collect($validated)->except(['image', 'gallery_images'])->toArray(),
            $request->file('image'),
            $request->file('gallery_images', []),
        );

        return response()->json($announcement);
    }

    // DELETE /api/admin/announcements/{announcement}
    public function destroy(Announcement $announcement): JsonResponse
    {
        $this->service->delete($announcement);
        return response()->json(['message' => 'Announcement deleted.']);
    }
}
