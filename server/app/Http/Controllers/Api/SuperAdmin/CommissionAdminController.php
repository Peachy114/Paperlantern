<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Api\CommissionAccountController;
use App\Http\Controllers\Controller;
use App\Models\CommissionArtistProfile;
use App\Models\CommissionCategory;
use App\Models\CommissionMessage;
use App\Models\CommissionOrder;
use App\Models\CommissionPlatformTerm;
use App\Models\CommissionRating;
use App\Services\CommissionOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionAdminController extends Controller
{
    public function __construct(private CommissionOrderService $orders) {}

    public function orders(Request $request): JsonResponse
    {
        $status = (string) $request->query('status', 'all');

        $orders = CommissionOrder::query()
            ->when($status !== 'all', fn($query) => $query->where('status', $status))
            ->with([
                'service:id,title,slug,image_path',
                'artist:id,name,username,email,avatar,artist_verified',
                'customer:id,name,username,email,avatar',
            ])
            ->withCount('messages')
            ->latest()
            ->paginate(30);

        $orders->getCollection()->transform(fn(CommissionOrder $order) => CommissionAccountController::formatOrder($order));

        return response()->json([
            'orders' => $orders,
            'counts' => CommissionOrder::query()
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
        ]);
    }

    public function updateOrder(Request $request, CommissionOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'in:release,refund,dispute'],
        ]);

        if ($validated['action'] === 'release') {
            $order = $this->orders->release($order);
            $message = 'Commission escrow released.';
        } elseif ($validated['action'] === 'refund') {
            $order = $this->orders->refund($order);
            $message = 'Commission escrow refunded by admin.';
        } else {
            $order->update([
                'status' => 'disputed',
                'disputed_at' => now(),
            ]);
            $message = 'Commission marked as disputed.';
        }

        return response()->json([
            'message' => $message,
            'order' => CommissionAccountController::formatOrder($order->fresh(['service', 'artist', 'customer'])),
        ]);
    }

    public function ratingAppeals(): JsonResponse
    {
        return response()->json([
            'ratings' => CommissionRating::query()
                ->where('status', 'appealed')
                ->with(['service:id,title,slug', 'customer:id,name,username,avatar', 'artist:id,name,username,avatar'])
                ->latest('appealed_at')
                ->paginate(30),
        ]);
    }

    public function updateRating(Request $request, CommissionRating $rating): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:published,hidden'],
        ]);

        $rating->update([
            'status' => $validated['status'],
            'reviewed_at' => now(),
        ]);

        \App\Http\Controllers\Api\CommissionAccountController::refreshArtistRatingStats($rating->artist_id);

        return response()->json([
            'message' => $validated['status'] === 'hidden'
                ? 'Rating appeal approved and rating hidden.'
                : 'Rating appeal rejected and rating restored.',
            'rating' => \App\Http\Controllers\Api\CommissionAccountController::formatRating($rating->fresh(['service', 'customer'])),
        ]);
    }

    public function artistTerms(Request $request): JsonResponse
    {
        $status = (string) $request->query('status', 'pending');

        $profiles = CommissionArtistProfile::query()
            ->when(
                in_array($status, ['pending', 'approved', 'hidden', 'suspended'], true),
                fn($query) => $query->where('terms_moderation_status', $status)
            )
            ->whereNotNull('terms')
            ->with('user:id,name,username,email,avatar,artist_verified')
            ->latest()
            ->paginate(30);

        return response()->json(['artist_terms' => $profiles]);
    }

    public function updateArtistTerms(Request $request, CommissionArtistProfile $profile): JsonResponse
    {
        $validated = $request->validate([
            'terms_moderation_status' => ['required', 'in:approved,hidden,suspended'],
        ]);

        $profile->update(['terms_moderation_status' => $validated['terms_moderation_status']]);

        if ($validated['terms_moderation_status'] !== 'approved') {
            $profile->update([
                'commissions_enabled' => false,
                'commission_status' => 'closed',
            ]);
        }

        return response()->json([
            'message' => 'Artist commission terms reviewed.',
            'commission_profile' => $profile->fresh('user'),
        ]);
    }

    public function messages(CommissionOrder $order): JsonResponse
    {
        $order->loadMissing([
            'service:id,title,slug,image_path',
            'artist:id,name,username,email,avatar',
            'customer:id,name,username,email,avatar',
        ]);

        return response()->json([
            'order' => CommissionAccountController::formatOrder($order),
            'messages' => CommissionMessage::query()
                ->where('commission_order_id', $order->id)
                ->with('sender:id,name,username,avatar')
                ->oldest()
                ->get()
                ->map(fn(CommissionMessage $message) => [
                    'id' => $message->id,
                    'body' => $message->body,
                    'image_path' => $message->image_moderation_status === 'suspended' ? null : $message->image_path,
                    'image_moderation_status' => $message->image_moderation_status,
                    'created_at' => $message->created_at,
                    'sender' => $message->sender ? [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name,
                        'username' => $message->sender->username,
                        'avatar' => $message->sender->avatar,
                    ] : null,
                ])
                ->values(),
        ]);
    }

    public function terms(): JsonResponse
    {
        $terms = CommissionPlatformTerm::query()->firstOrCreate(
            ['key' => 'default'],
            [
                'terms' => [
                    'Commission requests start with a quote before payment is collected.',
                    'Paid credits are held for delivery review and release after 5 days if there is no dispute.',
                    'Completed commissions only can receive public ratings.',
                    'Refunds, cancellations, and invalid ratings can be escalated to support.',
                ],
                'is_active' => true,
            ]
        );

        return response()->json(['terms' => $terms->terms ?? []]);
    }

    public function updateTerms(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'terms' => ['required', 'array', 'min:1', 'max:20'],
            'terms.*' => ['required', 'string', 'max:500'],
        ]);

        CommissionPlatformTerm::query()->updateOrCreate(
            ['key' => 'default'],
            ['terms' => array_values($validated['terms']), 'is_active' => true]
        );

        return response()->json([
            'message' => 'Commission platform terms updated.',
            'terms' => array_values($validated['terms']),
        ]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'categories' => CommissionCategory::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'sort_order', 'is_active']),
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', 'unique:commission_categories,slug'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $slug = $validated['slug'] ?? \Illuminate\Support\Str::slug($validated['name']);
        $category = CommissionCategory::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['category' => $category], 201);
    }

    public function updateCategory(Request $request, CommissionCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category->update($validated);

        return response()->json(['category' => $category->fresh()]);
    }
}
