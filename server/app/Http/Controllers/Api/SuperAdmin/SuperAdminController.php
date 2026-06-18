<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Work;
use App\Models\Chapter;
use App\Services\SuperAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminController extends Controller
{
    public function __construct(private SuperAdminService $service) {}

    // GET /api/admin/dashboard
    public function dashboard(): JsonResponse
    {
        return response()->json($this->service->getDashboard());
    }

    // GET /api/admin/users
    public function users(): JsonResponse
    {
        return response()->json($this->service->getAllUsers());
    }

    // GET /api/admin/users/{user}
    public function showUser(User $user): JsonResponse
    {
        return response()->json($this->service->getUserWithWorks($user));
    }

    // PUT /api/admin/users/{user}/ban
    public function banUser(Request $request, User $user): JsonResponse
    {
        if ($user->is_banned) {
            return response()->json(['message' => 'User is already banned.'], 422);
        }

        return response()->json($this->service->banUser($request->user()->id, $user));
    }

    // PUT /api/admin/users/{user}/unban
    public function unbanUser(Request $request, User $user): JsonResponse
    {
        if (!$user->is_banned) {
            return response()->json(['message' => 'User is not banned.'], 422);
        }

        return response()->json($this->service->unbanUser($request->user()->id, $user));
    }

    // DELETE /api/admin/users/{user}
    public function deleteUser(Request $request, User $user): JsonResponse
    {
        $this->service->deleteUser($request->user()->id, $user);
        return response()->json(['message' => 'User deleted.']);
    }

    // DELETE /api/admin/works/{work}
    public function deleteWork(Request $request, Work $work): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $this->service->deleteWork($request->user()->id, $work, $validated['notes'] ?? null);
        return response()->json(['message' => 'Work deleted.']);
    }

    // GET /api/admin/chapters/{chapter}
    public function viewChapter(Request $request, Chapter $chapter): JsonResponse
    {
        return response()->json($this->service->viewChapter($request->user()->id, $chapter));
    }

    // DELETE /api/admin/chapters/{chapter}
    public function deleteChapter(Request $request, Chapter $chapter): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $this->service->deleteChapter($request->user()->id, $chapter, $validated['notes'] ?? null);
        return response()->json(['message' => 'Chapter deleted.']);
    }

    // GET /api/admin/logs
    public function logs(Request $request): JsonResponse
    {
        return response()->json($this->service->getLogs($request->query('page', 1)));
    }
}