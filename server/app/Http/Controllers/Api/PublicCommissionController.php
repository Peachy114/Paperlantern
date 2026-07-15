<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommissionCategory;
use App\Models\CommissionMessage;
use App\Models\CommissionOrder;
use App\Models\CommissionPlatformTerm;
use App\Models\CommissionRating;
use App\Models\CommissionService;
use App\Models\FeatureBoost;
use App\Repositories\WalletRepository;
use App\Services\PageLayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicCommissionController extends Controller
{
    public function __construct(
        private WalletRepository $wallets,
        private PageLayoutService $layouts,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = CommissionService::query()
            ->select('commission_services.*')
            ->where('is_published', true)
            ->where('status', 'open')
            ->selectSub($this->activeBoostSubquery(), 'boosted_until')
            ->whereHas('user.commissionArtistProfile', function ($profile) {
                $profile
                    ->where('application_status', 'approved')
                    ->where('commissions_enabled', true);
            })
            ->with([
                'category:id,name,slug',
                'user:id,name,username,avatar,artist_title,artist_verified',
                'user.commissionArtistProfile:id,user_id,commission_status,terms,terms_moderation_status,customers_count,average_rating,ratings_count',
            ])
            ->withCount([
                'ratings as published_ratings_count' => fn($q) => $q->where('status', 'published'),
            ])
            ->withAvg([
                'ratings as published_average_rating' => fn($q) => $q->where('status', 'published'),
            ], 'rating');

        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->query('category')));
        }

        if ($request->filled('q')) {
            $search = (string) $request->query('q');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($artist) use ($search) {
                        $artist
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    });
            });
        }

        $commissions = $query
            ->orderByRaw('CASE WHEN boosted_until IS NULL THEN 1 ELSE 0 END ASC')
            ->orderByDesc('boosted_until')
            ->orderBy('sort_order')
            ->latest()
            ->paginate(24);

        $commissions->getCollection()->transform(fn(CommissionService $service) => $this->formatService($service));

        return response()->json([
            'categories' => CommissionCategory::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'platform_terms' => $this->platformTerms(),
            'layout' => $this->layouts->get('commissions'),
            'commissions' => $commissions,
        ]);
    }

    public function show(CommissionService $commission): JsonResponse
    {
        abort_unless($commission->is_published && in_array($commission->status, ['open', 'waitlist', 'closed'], true), 404);
        abort_unless(
            $commission->user?->commissionArtistProfile?->application_status === 'approved'
            && $commission->user?->commissionArtistProfile?->commissions_enabled,
            404
        );

        $commission->loadMissing([
            'category:id,name,slug',
            'user:id,name,username,avatar,artist_title,artist_verified',
            'user.commissionArtistProfile:id,user_id,commission_status,terms,terms_moderation_status,customers_count,average_rating,ratings_count',
        ]);

        return response()->json($this->formatService($commission));
    }

    public function request(Request $request, CommissionService $commission): JsonResponse
    {
        $validated = $request->validate([
            'request_message' => ['required', 'string', 'min:10', 'max:3000'],
            'reference_notes' => ['nullable', 'string', 'max:3000'],
            'reference_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'agree_to_flow' => ['accepted'],
        ]);

        $commission->loadMissing('user.commissionArtistProfile');
        abort_unless($commission->is_published && in_array($commission->status, ['open', 'waitlist'], true), 404);
        abort_unless(
            $commission->user?->commissionArtistProfile?->application_status === 'approved'
            && $commission->user?->commissionArtistProfile?->commissions_enabled,
            404
        );
        abort_if($commission->user_id === $request->user()->id, 403, 'You cannot request your own commission service.');

        $quoteCredits = max(0, (int) $commission->base_price_credits);
        $flow = $this->flow($commission);
        $upfrontCredits = $this->upfrontCredits($flow, $quoteCredits);
        $wallet = $this->wallets->findOrCreateByUser($request->user()->id);

        if ($quoteCredits > 0 && $wallet->balance < $quoteCredits) {
            return response()->json([
                'message' => 'Add credits first, then come back to request this commission.',
                'requires_top_up' => true,
                'balance' => $wallet->balance,
                'required_credits' => $quoteCredits,
            ], 402);
        }

        $order = DB::transaction(function () use ($request, $commission, $validated, $quoteCredits, $flow, $upfrontCredits, $wallet) {
            $order = CommissionOrder::create([
                'commission_service_id' => $commission->id,
                'artist_id' => $commission->user_id,
                'customer_id' => $request->user()->id,
                'status' => $upfrontCredits > 0 ? 'awaiting_payment' : 'requested',
                'request_message' => $validated['request_message'],
                'reference_notes' => $validated['reference_notes'] ?? null,
                'quote_credits' => $quoteCredits,
                'credits_checked' => $quoteCredits,
                'escrow_credits' => 0,
                'flow_snapshot' => $flow,
                'current_step_index' => 0,
                'auto_pay_agreed' => true,
            ]);

            if ($request->hasFile('reference_image')) {
                $imagePath = $request->file('reference_image')->store("commission-messages/{$order->id}", 'public');

                CommissionMessage::create([
                    'commission_order_id' => $order->id,
                    'sender_id' => $request->user()->id,
                    'body' => 'Reference image attached from the commission request.',
                    'image_path' => $imagePath,
                    'image_moderation_status' => 'pending',
                ]);
            }

            if ($upfrontCredits > 0) {
                $transaction = $this->wallets->debit($wallet, $upfrontCredits, [
                    'source' => 'commission_escrow',
                    'description' => "Commission escrow - {$commission->title}",
                    'meta' => [
                        'commission_order_id' => $order->id,
                        'commission_service_id' => $commission->id,
                        'upfront_credits' => $upfrontCredits,
                    ],
                ]);

                if ($transaction === false) {
                    abort(402, 'Insufficient credits.');
                }

                $order->update([
                    'status' => 'requested',
                    'escrow_credits' => $upfrontCredits,
                ]);
            }

            return $order->fresh(['service.category', 'artist:id,name,username,avatar', 'customer:id,name,username,avatar']);
        });

        return response()->json([
            'message' => $upfrontCredits > 0
                ? 'Commission request sent and upfront credits are held in escrow.'
                : 'Commission request sent.',
            'order' => $this->formatOrder($order),
        ], 201);
    }

    private function formatService(CommissionService $service): array
    {
        $profile = $service->user?->commissionArtistProfile;
        $serviceRating = (float) ($service->published_average_rating ?? 0);
        $profileRating = (float) ($profile?->average_rating ?? 0);
        $rating = $serviceRating > 0 ? $serviceRating : $profileRating;
        $slug = $this->serviceSlug($service);

        return [
            'id' => $service->id,
            'title' => $service->title,
            'slug' => $slug,
            'description' => $service->description,
            'image_path' => $service->image_path,
            'status' => $service->status,
            'boosted_until' => $service->boosted_until ?? null,
            'base_price_credits' => (int) $service->base_price_credits,
            'min_price_credits' => $service->min_price_credits,
            'delivery_days' => $service->delivery_days,
            'slots_available' => $service->slots_available,
            'flow' => $this->flow($service),
            'terms' => $service->terms,
            'quote_rules' => $service->quote_rules,
            'refund_policy' => $service->refund_policy,
            'required_references' => $service->required_references,
            'artist_terms' => $profile?->terms_moderation_status === 'approved' ? $profile->terms : null,
            'platform_terms' => $this->platformTerms(),
            'rating_average' => round($rating, 2),
            'ratings_count' => (int) (($service->published_ratings_count ?? 0) ?: ($profile?->ratings_count ?? 0)),
            'customers_count' => (int) ($profile?->customers_count ?? 0),
            'category' => $service->category ? [
                'id' => $service->category->id,
                'name' => $service->category->name,
                'slug' => $service->category->slug,
            ] : null,
            'artist' => $service->user ? [
                'id' => $service->user->id,
                'name' => $service->user->name,
                'username' => $service->user->username,
                'avatar' => $service->user->avatar,
                'artist_title' => $service->user->artist_title,
                'artist_verified' => (bool) $service->user->artist_verified,
                'commission_status' => $profile?->commission_status ?? 'closed',
            ] : null,
            'recent_ratings' => $this->recentRatings($service),
        ];
    }

    private function serviceSlug(CommissionService $service): string
    {
        if ($service->slug) {
            return $service->slug;
        }

        $slug = CommissionService::generateSlug($service->title, $service->id);
        $service->forceFill(['slug' => $slug])->saveQuietly();

        return $slug;
    }

    private function flow(CommissionService $service): array
    {
        if (is_array($service->flow) && count($service->flow) > 0) {
            return $service->flow;
        }

        return [
            ['type' => 'request', 'label' => 'Client request'],
            ['type' => 'quote', 'label' => 'Artist quote'],
            ['type' => 'pay', 'label' => 'Pay 50%', 'percent' => 50],
            ['type' => 'process', 'label' => 'Sketch'],
            ['type' => 'process', 'label' => 'Revision'],
            ['type' => 'pay', 'label' => 'Pay 50%', 'percent' => 50],
            ['type' => 'receipt', 'label' => 'Delivery and receipt'],
        ];
    }

    private function recentRatings(CommissionService $service): array
    {
        return CommissionRating::query()
            ->where('commission_service_id', $service->id)
            ->where('status', 'published')
            ->with('customer:id,name,username,avatar')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn(CommissionRating $rating) => [
                'id' => $rating->id,
                'rating' => (int) $rating->rating,
                'comment' => $rating->comment,
                'created_at' => $rating->created_at,
                'customer' => $rating->customer ? [
                    'id' => $rating->customer->id,
                    'name' => $rating->customer->name,
                    'username' => $rating->customer->username,
                    'avatar' => $rating->customer->avatar,
                ] : null,
            ])
            ->all();
    }

    private function upfrontCredits(array $flow, int $quoteCredits): int
    {
        $first = $flow[0] ?? null;
        if (! $first || ($first['type'] ?? null) !== 'pay') {
            return 0;
        }

        $percent = max(0, min(100, (int) ($first['percent'] ?? 0)));
        return (int) ceil($quoteCredits * ($percent / 100));
    }

    private function formatOrder(CommissionOrder $order): array
    {
        return [
            'id' => $order->id,
            'status' => $order->status,
            'quote_credits' => $order->quote_credits,
            'escrow_credits' => $order->escrow_credits,
            'request_message' => $order->request_message,
            'reference_notes' => $order->reference_notes,
            'flow_snapshot' => $order->flow_snapshot,
            'service' => $order->service ? [
                'id' => $order->service->id,
                'title' => $order->service->title,
                'slug' => $order->service->slug,
            ] : null,
            'artist' => $order->artist ? [
                'id' => $order->artist->id,
                'name' => $order->artist->name,
                'username' => $order->artist->username,
                'avatar' => $order->artist->avatar,
            ] : null,
        ];
    }

    private function platformTerms(): array
    {
        $stored = CommissionPlatformTerm::query()
            ->where('key', 'default')
            ->where('is_active', true)
            ->first();

        if ($stored && is_array($stored->terms) && count($stored->terms) > 0) {
            return $stored->terms;
        }

        return [
            'Commission requests start with a quote before payment is collected.',
            'Paid credits are held for delivery review and release after 5 days if there is no dispute.',
            'Completed commissions only can receive public ratings.',
            'Refunds, cancellations, and invalid ratings can be escalated to support.',
        ];
    }

    private function activeBoostSubquery()
    {
        return FeatureBoost::query()
            ->selectRaw('MAX(ends_at)')
            ->whereColumn('target_id', 'commission_services.id')
            ->where('target_type', 'commission_service')
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now());
    }
}
