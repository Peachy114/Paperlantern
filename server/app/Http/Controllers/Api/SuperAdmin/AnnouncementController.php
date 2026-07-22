<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\AnnouncementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
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
            'tag'      => ['required', 'in:event,update,reminder'],
            'audience' => ['required', 'in:public,studio'],
            'image'    => ['nullable', 'image', 'max:2048'],
            'is_pinned'=> ['boolean'],
            'rotation_seconds' => ['nullable', 'integer', 'min:0', 'max:300'],
        ]);

        $announcement = $this->service->create(
            $request->user()->id,
            collect($validated)->except('image')->toArray(),
            $request->file('image'),
        );

        return response()->json($announcement, 201);
    }

    // PUT /api/admin/announcements/{announcement}
    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $validated = $request->validate([
            'title'    => ['sometimes', 'string', 'max:255'],
            'content'  => ['sometimes', 'string'],
            'tag'      => ['sometimes', 'in:event,update,reminder'],
            'audience' => ['sometimes', 'in:public,studio'],
            'image'    => ['nullable', 'image', 'max:2048'],
            'is_pinned'=> ['boolean'],
            'rotation_seconds' => ['nullable', 'integer', 'min:0', 'max:300'],
        ]);

        $announcement = $this->service->update(
            $announcement,
            collect($validated)->except('image')->toArray(),
            $request->file('image'),
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
