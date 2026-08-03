<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\CommissionOrder;
use App\Services\AppNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function __construct(private AppNotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $filter = (string) $request->query('filter', 'all');
        if (! in_array($filter, ['all', 'unread', 'read'], true)) {
            $filter = 'all';
        }

        $perPage = max(1, min(50, $request->integer('per_page', 20)));
        $category = trim((string) $request->query('category', ''));
        $section = trim((string) $request->query('section', ''));

        $query = AppNotification::query()
            ->where('user_id', $request->user()->id)
            ->when($category !== '', fn($notificationQuery) => $notificationQuery->where('category', $category))
            ->when($section !== '', function ($notificationQuery) use ($section) {
                $categories = AppNotificationService::categoriesForSection($section);
                if (count($categories) > 0) {
                    $notificationQuery->whereIn('category', $categories);
                }
            })
            ->when($filter === 'unread', fn($notificationQuery) => $notificationQuery->whereNull('read_at'))
            ->when($filter === 'read', fn($notificationQuery) => $notificationQuery->whereNotNull('read_at'))
            ->latest();

        $notifications = $query->paginate($perPage);

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
                'unread' => AppNotification::query()
                    ->where('user_id', $request->user()->id)
                    ->whereNull('read_at')
                    ->count(),
                'attention' => $this->attention($request),
            ],
        ]);
    }

    public function preferences(Request $request): JsonResponse
    {
        return response()->json([
            'preferences' => $this->notifications->preferences($request->user()),
            'reader_categories' => AppNotificationService::READER_CATEGORIES,
            'creator_categories' => AppNotificationService::CREATOR_CATEGORIES,
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
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
        abort_unless($notification->user_id === $request->user()->id, 403);

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json(['notification' => $notification->fresh()]);
    }


    public function markSectionRead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section' => [
                'required',
                'string',
                Rule::in([
                    'messages',
                    'commissions',
                    'shop',
                    'comments',
                    'earnings',
                    'arts',
                    'announcements',
                    'releases',
                ]),
            ],
        ]);

        $section = $validated['section'];
        $categories = AppNotificationService::categoriesForSection($section);
        $readAt = now();

        $updated = AppNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->where(function ($notificationQuery) use ($section, $categories) {
                $notificationQuery
                    ->whereIn('category', $categories)
                    ->orWhere('meta->section', $section);
            })
            ->update([
                'read_at' => $readAt,
                'updated_at' => $readAt,
            ]);

        return response()->json([
            'message' => 'Section notifications marked as read.',
            'section' => $section,
            'updated' => $updated,
            'attention' => $this->attention($request),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        AppNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Notifications marked as read.']);
    }

    private function attention(Request $request): array
    {
        $userId = $request->user()->id;

        $unreadNotifications = AppNotification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->get(['category', 'meta']);

        $sections = $unreadNotifications
            ->map(function (AppNotification $notification) {
                return $notification->meta['section']
                    ?? AppNotificationService::sectionForCategory($notification->category);
            })
            ->filter()
            ->unique();

        $hasUnreadMessages = DB::table('commission_messages')
            ->join('commission_orders', 'commission_orders.id', '=', 'commission_messages.commission_order_id')
            ->where(function ($participant) use ($userId) {
                $participant
                    ->where('commission_orders.artist_id', $userId)
                    ->orWhere('commission_orders.customer_id', $userId);
            })
            ->where('commission_messages.sender_id', '!=', $userId)
            ->where(function ($unread) use ($userId) {
                $unread
                    ->where(function ($artist) use ($userId) {
                        $artist
                            ->where('commission_orders.artist_id', $userId)
                            ->where(function ($readAt) {
                                $readAt
                                    ->whereNull('commission_orders.artist_last_read_at')
                                    ->orWhereColumn('commission_messages.created_at', '>', 'commission_orders.artist_last_read_at');
                            });
                    })
                    ->orWhere(function ($customer) use ($userId) {
                        $customer
                            ->where('commission_orders.customer_id', $userId)
                            ->where(function ($readAt) {
                                $readAt
                                    ->whereNull('commission_orders.customer_last_read_at')
                                    ->orWhereColumn('commission_messages.created_at', '>', 'commission_orders.customer_last_read_at');
                            });
                    });
            })
            ->exists();

        $hasCommissionAction = CommissionOrder::query()
            ->whereNotNull('commission_service_id')
            ->where(function ($participant) use ($userId) {
                $participant->where('artist_id', $userId)->orWhere('customer_id', $userId);
            })
            ->where(function ($attention) use ($userId) {
                $attention
                    ->where(function ($artistAttention) use ($userId) {
                        $artistAttention
                            ->where('artist_id', $userId)
                            ->whereIn('status', ['requested', 'disputed']);
                    })
                    ->orWhere(function ($customerAttention) use ($userId) {
                        $customerAttention
                            ->where('customer_id', $userId)
                            ->where(function ($status) {
                                $status
                                    ->whereIn('status', ['quoted', 'disputed'])
                                    ->orWhere(function ($delivery) {
                                        $delivery
                                            ->where('status', 'delivered')
                                            ->whereNull('final_payment_paid_at');
                                    });
                            });
                    });
            })
            ->exists();

        return [
            'messages' => $hasUnreadMessages || $sections->contains('messages'),
            'commissions' => $hasCommissionAction || $sections->contains('commissions'),
            'shop' => $sections->contains('shop'),
            'comments' => $sections->contains('comments'),
            'earnings' => $sections->contains('earnings'),
            'arts' => $sections->contains('arts'),
            'notifications' => $unreadNotifications->isNotEmpty(),
        ];
    }
}
