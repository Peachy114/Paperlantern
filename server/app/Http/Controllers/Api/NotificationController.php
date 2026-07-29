<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Services\AppNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private AppNotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        // notification list ----
        $notifications = AppNotification::query()
            ->where('user_id', $request->user()->id)
            ->when($request->query('category'), fn($query, $category) => $query->where('category', $category))
            ->latest()
            ->paginate($request->integer('per_page', 30));

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
                'unread' => AppNotification::where('user_id', $request->user()->id)->whereNull('read_at')->count(),
            ],
        ]);
    }

    public function preferences(Request $request): JsonResponse
    {
        // notification preferences ----
        return response()->json([
            'preferences' => $this->notifications->preferences($request->user()),
            'reader_categories' => AppNotificationService::READER_CATEGORIES,
            'creator_categories' => AppNotificationService::CREATOR_CATEGORIES,
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        // preference validation ----
        $validated = $request->validate([
            'reader_categories' => ['sometimes', 'array'],
            'reader_categories.*' => ['string', 'max:80'],
            'creator_categories' => ['sometimes', 'array'],
            'creator_categories.*' => ['string', 'max:80'],
            'in_app_enabled' => ['sometimes', 'boolean'],
            'email_enabled' => ['sometimes', 'boolean'],
            'push_enabled' => ['sometimes', 'boolean'],
            'digest_enabled' => ['sometimes', 'boolean'],
            'digest_frequency' => ['sometimes', 'in:daily,weekly'],
            'quiet_hours_start' => ['nullable', 'date_format:H:i'],
            'quiet_hours_end' => ['nullable', 'date_format:H:i'],
            'per_work_controls' => ['nullable', 'array'],
        ]);

        $preferences = $this->notifications->preferences($request->user());
        $preferences->update($validated);

        return response()->json(['preferences' => $preferences->fresh()]);
    }

    public function markRead(Request $request, AppNotification $notification): JsonResponse
    {
        // mark one notification read ----
        abort_unless($notification->user_id === $request->user()->id, 403);

        $notification->update(['read_at' => now()]);

        return response()->json(['notification' => $notification->fresh()]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        // mark all notifications read ----
        AppNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Notifications marked as read.']);
    }
}
