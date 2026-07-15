<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArtistSticker;
use App\Models\NobleRoyaltyGift;
use App\Models\ProfileBorder;
use App\Models\RoyaltyDesignAsset;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Models\UserSubscription;
use App\Repositories\WalletRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class NobleRoyaltyController extends Controller
{
    private const PUBLISH_COST = 20;

    public function __construct(private WalletRepository $wallets) {}

    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user();
        $activeSubscription = $viewer ? $this->activeSubscription($viewer) : null;
        $giftIds = $viewer ? $this->giftIds($viewer) : ['stickers' => [], 'borders' => [], 'designs' => []];

        $stickers = ArtistSticker::query()
            ->with('user:id,name,username,avatar,role')
            ->withCount(['subscriptions', 'purchases'])
            ->where(function ($query) use ($viewer, $giftIds) {
                $query->where('is_public', true);

                if ($viewer) {
                    $query->orWhere('user_id', $viewer->id)
                        ->orWhereIn('id', $giftIds['stickers'])
                        ->orWhereHas('purchases', fn($inner) => $inner->where('user_id', $viewer->id))
                        ->orWhereHas('subscriptions', fn($inner) => $inner->where('user_id', $viewer->id));
                }
            })
            ->orderByDesc('is_public')
            ->orderBy('sort_order')
            ->latest()
            ->get()
            ->map(fn(ArtistSticker $sticker) => $this->formatSticker($sticker, $viewer, $activeSubscription, $giftIds['stickers']))
            ->values();

        $borders = ProfileBorder::query()
            ->with('user:id,name,username,avatar,role')
            ->where(function ($query) use ($viewer, $giftIds) {
                $query->where('is_public', true);

                if ($viewer) {
                    $query->orWhere('user_id', $viewer->id)
                        ->orWhereIn('id', $giftIds['borders']);
                }
            })
            ->orderByDesc('is_default')
            ->orderByDesc('is_public')
            ->orderBy('sort_order')
            ->latest()
            ->get()
            ->map(fn(ProfileBorder $border) => $this->formatBorder($border, $viewer, $activeSubscription, $giftIds['borders']))
            ->values();

        $designs = RoyaltyDesignAsset::query()
            ->where('is_active', true)
            ->where(function ($query) use ($viewer, $giftIds) {
                $query->where('is_public', true);

                if ($viewer) {
                    $query->orWhere('user_id', $viewer->id)
                        ->orWhereIn('id', $giftIds['designs']);
                }
            })
            ->orderBy('type')
            ->orderBy('sort_order')
            ->latest()
            ->get()
            ->map(fn(RoyaltyDesignAsset $asset) => $this->formatDesign($asset, $giftIds['designs'], $viewer, $activeSubscription))
            ->values();

        $plans = SubscriptionPlan::query()
            ->where('is_active', true)
            ->when($viewer && $viewer->role !== 'super_admin', fn($query) => $query->where('audience', $viewer->role))
            ->orderByDesc('is_recommended')
            ->orderBy('sort_order')
            ->get()
            ->map(fn(SubscriptionPlan $plan) => $this->formatPlan($plan))
            ->values();

        return response()->json([
            'publish_cost' => self::PUBLISH_COST,
            'current_subscription' => $activeSubscription ? $this->formatSubscription($activeSubscription) : null,
            'stickers' => $stickers,
            'borders' => $borders,
            'designs' => $designs,
            'plans' => $plans,
        ]);
    }

    public function storeBorder(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'storyteller', 403);

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['required', 'file', 'mimes:png,webp,gif', 'max:10240'],
            'is_free' => ['sometimes', 'boolean'],
            'credit_cost' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'subscription_free' => ['sometimes', 'boolean'],
            'publish_public' => ['sometimes', 'boolean'],
        ]);

        $isFree = $request->boolean('is_free', true);
        $publishPublic = $request->boolean('publish_public');
        $name = trim((string) ($validated['name'] ?? '')) ?: pathinfo($request->file('image')->getClientOriginalName(), PATHINFO_FILENAME);
        if ($publishPublic && ! $this->canPublishWithoutFee($request->user())) {
            $this->chargePublishFee($request->user(), $name, 'border', null);
        }

        $border = ProfileBorder::create([
            'user_id' => $request->user()->id,
            'name' => $name,
            'description' => $validated['description'] ?? null,
            'image_path' => $request->file('image')->store("artist-profiles/{$request->user()->id}/borders", 'public'),
            'is_default' => false,
            'is_public' => $publishPublic,
            'is_free' => $isFree,
            'credit_cost' => $isFree ? 0 : max(1, (int) ($validated['credit_cost'] ?? 1)),
            'subscription_free' => $request->boolean('subscription_free'),
            'published_at' => $publishPublic ? now() : null,
            'sort_order' => ((int) ProfileBorder::where('user_id', $request->user()->id)->max('sort_order')) + 1,
        ]);

        return response()->json([
            'message' => $publishPublic
                ? ($this->canPublishWithoutFee($request->user()) ? 'Border created and published.' : 'Border created and published for 20 credits.')
                : 'Border created privately.',
            'border' => $this->formatBorder($border->load('user'), $request->user(), $this->activeSubscription($request->user()), []),
        ], 201);
    }

    public function storeMessageBackground(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'storyteller', 403);

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'subscription_free' => ['sometimes', 'boolean'],
            'publish_public' => ['sometimes', 'boolean'],
        ]);

        $publishPublic = $request->boolean('publish_public');
        $name = trim((string) ($validated['name'] ?? '')) ?: pathinfo($request->file('image')->getClientOriginalName(), PATHINFO_FILENAME);

        if ($publishPublic && ! $this->canPublishWithoutFee($request->user())) {
            $this->chargePublishFee($request->user(), $name, 'message_background', null);
        }

        $asset = RoyaltyDesignAsset::create([
            'user_id' => $request->user()->id,
            'type' => 'message_background',
            'name' => $name,
            'description' => $validated['description'] ?? null,
            'image_path' => $request->file('image')->store("artist-profiles/{$request->user()->id}/message-backgrounds", 'public'),
            'is_active' => true,
            'is_public' => $publishPublic,
            'subscription_free' => $request->boolean('subscription_free'),
            'published_at' => $publishPublic ? now() : null,
            'sort_order' => ((int) RoyaltyDesignAsset::where('user_id', $request->user()->id)->where('type', 'message_background')->max('sort_order')) + 1,
        ]);

        return response()->json([
            'message' => $publishPublic
                ? ($this->canPublishWithoutFee($request->user()) ? 'Message background created and published.' : 'Message background created and published for 20 credits.')
                : 'Message background created privately.',
            'asset' => $this->formatDesign($asset, [], $request->user(), $this->activeSubscription($request->user())),
        ], 201);
    }

    public function publishSticker(Request $request, ArtistSticker $sticker): JsonResponse
    {
        abort_unless($sticker->user_id === $request->user()->id, 403);

        return response()->json($this->publishAsset($request->user(), $sticker));
    }

    public function publishBorder(Request $request, ProfileBorder $border): JsonResponse
    {
        abort_unless($border->user_id === $request->user()->id, 403);

        return response()->json($this->publishAsset($request->user(), $border));
    }

    public function subscribe(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        abort_unless($plan->is_active, 404);
        abort_unless($request->user()->role === 'super_admin' || $plan->audience === $request->user()->role, 422, 'Choose a subscription for your current account type.');

        $subscription = DB::transaction(function () use ($request, $plan) {
            $creditCost = $plan->effectiveCreditCost();

            if ($request->user()->role !== 'super_admin' && $creditCost > 0) {
                $wallet = $this->wallets->findOrCreateByUser($request->user()->id);
                $debit = $this->wallets->debit($wallet, $creditCost, [
                    'source' => 'subscription_purchase',
                    'description' => "Subscription - {$plan->name}",
                    'meta' => [
                        'subscription_plan_id' => $plan->id,
                        'monthly_credit_cost' => $plan->monthly_credit_cost,
                        'charged_credit_cost' => $creditCost,
                        'promo_label' => $plan->promoIsActive() ? $plan->promo_label : null,
                        'month' => now()->format('Y-m'),
                    ],
                ]);

                if ($debit === false) {
                    abort(402, "Not enough credits for {$plan->name}.");
                }
            }

            UserSubscription::where('user_id', $request->user()->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                    'grace_ends_at' => now()->addDays(5),
                ]);

            return UserSubscription::create([
                'user_id' => $request->user()->id,
                'subscription_plan_id' => $plan->id,
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => now()->addDays(30),
                'meta' => [
                    'board_limit' => $plan->board_limit,
                    'unlimited_board' => $plan->unlimited_board,
                    'free_boost_days_remaining' => $plan->free_boost_days,
                    'audience' => $plan->audience,
                    'tier_key' => $plan->tier_key,
                ],
            ])->load('plan');
        });

        return response()->json([
            'message' => "{$plan->name} is active for 30 days.",
            'subscription' => $this->formatSubscription($subscription),
        ], 201);
    }

    public function adminPlans(): JsonResponse
    {
        return response()->json([
            'data' => SubscriptionPlan::orderBy('sort_order')->latest()->get()->map(fn(SubscriptionPlan $plan) => $this->formatPlan($plan))->values(),
        ]);
    }

    public function storePlan(Request $request): JsonResponse
    {
        $validated = $this->validatePlan($request);
        $validated['slug'] = Str::slug($validated['slug'] ?? $validated['name']);
        $validated['perks'] = $this->normalizePerks($validated['perks'] ?? []);

        $plan = SubscriptionPlan::create($validated);

        return response()->json($this->formatPlan($plan), 201);
    }

    public function updatePlan(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        $validated = $this->validatePlan($request, $plan);
        $validated['slug'] = Str::slug($validated['slug'] ?? $validated['name']);
        $validated['perks'] = $this->normalizePerks($validated['perks'] ?? []);

        $plan->update($validated);

        return response()->json($this->formatPlan($plan->fresh()));
    }

    public function gift(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_username' => ['required', 'string', 'exists:users,username'],
            'asset_type' => ['required', 'string', 'in:sticker,border,design'],
            'asset_id' => ['required', 'string'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $recipient = User::where('username', $validated['recipient_username'])->firstOrFail();
        [$class, $asset] = $this->giftableFromRequest($validated['asset_type'], $validated['asset_id']);

        $gift = NobleRoyaltyGift::firstOrCreate(
            [
                'recipient_id' => $recipient->id,
                'giftable_type' => $class,
                'giftable_id' => $asset->getKey(),
            ],
            [
                'giver_id' => $request->user()->id,
                'note' => $validated['note'] ?? null,
            ]
        );

        return response()->json([
            'message' => "Gift sent to @{$recipient->username}.",
            'gift' => $gift,
        ], 201);
    }

    private function publishAsset(User $user, ArtistSticker|ProfileBorder $asset): array
    {
        if ($asset->is_public) {
            return ['message' => 'Already published.', 'asset' => $asset->fresh()];
        }

        $freePublish = $this->canPublishWithoutFee($user);

        if (! $freePublish) {
            $this->chargePublishFee(
                $user,
                $asset->name,
                $asset instanceof ArtistSticker ? 'sticker' : 'border',
                $asset->getKey(),
            );
        }

        $asset->update([
            'is_public' => true,
            'published_at' => now(),
        ]);

        return [
            'message' => $freePublish
                ? 'Published with your active subscription.'
                : 'Published for 20 credits.',
            'asset' => $asset->fresh(),
        ];
    }

    private function canPublishWithoutFee(User $user): bool
    {
        return $user->role === 'super_admin' || (bool) $this->activeSubscription($user);
    }

    private function chargePublishFee(User $user, string $assetName, string $assetType, ?string $assetId): void
    {
        $wallet = $this->wallets->findOrCreateByUser($user->id);
        $debit = $this->wallets->debit($wallet, self::PUBLISH_COST, [
            'source' => 'noble_publish',
            'description' => "Published Noble Royalty - {$assetName}",
            'meta' => [
                'asset_type' => $assetType,
                'asset_id' => $assetId,
            ],
        ]);

        if ($debit === false) {
            abort(402, 'You need 20 credits to publish this Noble Royalty asset.');
        }
    }

    private function activeSubscription(User $user): ?UserSubscription
    {
        return UserSubscription::with('plan')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where(fn($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', now()))
            ->latest()
            ->first();
    }

    private function giftIds(User $user): array
    {
        $gifts = NobleRoyaltyGift::where('recipient_id', $user->id)->get();

        return [
            'stickers' => $gifts->where('giftable_type', ArtistSticker::class)->pluck('giftable_id')->all(),
            'borders' => $gifts->where('giftable_type', ProfileBorder::class)->pluck('giftable_id')->all(),
            'designs' => $gifts->where('giftable_type', RoyaltyDesignAsset::class)->pluck('giftable_id')->all(),
        ];
    }

    private function formatSticker(ArtistSticker $sticker, ?User $viewer, ?UserSubscription $subscription, array $giftIds): array
    {
        $owned = $viewer && $sticker->user_id === $viewer->id;
        $bought = $viewer
            ? $viewer->purchasedArtistStickers()->where('artist_stickers.id', $sticker->id)->exists()
            : false;
        $subscribed = $viewer
            ? $viewer->subscribedArtistStickers()->where('artist_stickers.id', $sticker->id)->exists()
            : false;
        $gifted = in_array($sticker->id, $giftIds, true);
        $admin = $viewer?->role === 'super_admin';
        $subscriptionUnlocked = $this->subscriptionUnlocks($subscription, (bool) $sticker->subscription_free);

        return [
            'id' => $sticker->id,
            'user_id' => $sticker->user_id,
            'name' => $sticker->name,
            'description' => $sticker->description,
            'bundle_name' => $sticker->bundle_name,
            'is_free' => (bool) $sticker->is_free,
            'credit_cost' => (int) ($sticker->is_free ? 0 : max(1, $sticker->credit_cost ?? 1)),
            'purchase_cost' => (int) ($sticker->is_free ? 0 : max(1, $sticker->credit_cost ?? 1)),
            'is_public' => (bool) $sticker->is_public,
            'subscription_free' => (bool) $sticker->subscription_free,
            'published_at' => $sticker->published_at,
            'image_path' => $sticker->image_path,
            'sort_order' => $sticker->sort_order,
            'subscriptions_count' => (int) ($sticker->subscriptions_count ?? 0),
            'purchases_count' => (int) ($sticker->purchases_count ?? 0),
            'owned' => $owned,
            'bought' => $bought,
            'subscribed' => $subscribed,
            'gifted' => $gifted,
            'subscription_unlocked' => $subscriptionUnlocked,
            'can_use' => $admin || $owned || $bought || $subscribed || $gifted || $subscriptionUnlocked || ($sticker->is_free && $sticker->is_public),
            'owner' => $sticker->user ? [
                'id' => $sticker->user->id,
                'name' => $sticker->user->name,
                'username' => $sticker->user->username,
                'avatar' => $sticker->user->avatar,
                'role' => $sticker->user->role,
            ] : null,
            'created_at' => $sticker->created_at,
            'updated_at' => $sticker->updated_at,
        ];
    }

    private function formatBorder(ProfileBorder $border, ?User $viewer, ?UserSubscription $subscription, array $giftIds): array
    {
        $owned = $viewer && $border->user_id === $viewer->id;
        $gifted = in_array($border->id, $giftIds, true);
        $admin = $viewer?->role === 'super_admin';
        $subscriptionUnlocked = $this->subscriptionUnlocks($subscription, (bool) $border->subscription_free);

        return [
            'id' => $border->id,
            'user_id' => $border->user_id,
            'name' => $border->name,
            'description' => $border->description,
            'image_path' => $border->image_path,
            'is_default' => (bool) $border->is_default,
            'is_public' => (bool) $border->is_public,
            'is_free' => (bool) $border->is_free,
            'credit_cost' => (int) ($border->is_free ? 0 : max(1, $border->credit_cost ?? 1)),
            'subscription_free' => (bool) $border->subscription_free,
            'published_at' => $border->published_at,
            'sort_order' => $border->sort_order,
            'owned' => $owned,
            'gifted' => $gifted,
            'subscription_unlocked' => $subscriptionUnlocked,
            'can_use' => $admin || $border->is_default || $owned || $gifted || $subscriptionUnlocked || ($border->is_free && $border->is_public),
            'owner' => $border->user ? [
                'id' => $border->user->id,
                'name' => $border->user->name,
                'username' => $border->user->username,
                'avatar' => $border->user->avatar,
                'role' => $border->user->role,
            ] : null,
            'created_at' => $border->created_at,
            'updated_at' => $border->updated_at,
        ];
    }

    private function formatDesign(
        RoyaltyDesignAsset $asset,
        array $giftIds,
        ?User $viewer = null,
        ?UserSubscription $subscription = null
    ): array
    {
        $owned = $viewer && $asset->user_id === $viewer->id;
        $gifted = in_array($asset->id, $giftIds, true);
        $subscriptionUnlocked = $this->subscriptionUnlocks($subscription, (bool) $asset->subscription_free);

        return [
            'id' => $asset->id,
            'user_id' => $asset->user_id,
            'type' => $asset->type,
            'name' => $asset->name,
            'description' => $asset->description,
            'image_path' => $asset->image_path,
            'is_active' => (bool) $asset->is_active,
            'is_public' => (bool) $asset->is_public,
            'subscription_free' => (bool) $asset->subscription_free,
            'published_at' => $asset->published_at,
            'gifted' => $gifted,
            'owned' => $owned,
            'subscription_unlocked' => $subscriptionUnlocked,
            'can_use' => $viewer?->role === 'super_admin' || $owned || $gifted || $subscriptionUnlocked || $asset->is_public,
            'sort_order' => $asset->sort_order,
            'created_at' => $asset->created_at,
            'updated_at' => $asset->updated_at,
        ];
    }

    private function formatPlan(SubscriptionPlan $plan): array
    {
        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'slug' => $plan->slug,
            'audience' => $plan->audience,
            'tier_key' => $plan->tier_key,
            'description' => $plan->description,
            'monthly_credit_cost' => (int) $plan->monthly_credit_cost,
            'effective_credit_cost' => $plan->effectiveCreditCost(),
            'promo_label' => $plan->promo_label,
            'promo_credit_cost' => $plan->promo_credit_cost !== null ? (int) $plan->promo_credit_cost : null,
            'promo_start_at' => $plan->promo_start_at,
            'promo_end_at' => $plan->promo_end_at,
            'promo_active' => $plan->promoIsActive(),
            'is_recommended' => (bool) $plan->is_recommended,
            'is_active' => (bool) $plan->is_active,
            'unlimited_board' => (bool) $plan->unlimited_board,
            'board_limit' => (int) $plan->board_limit,
            'free_boost_days' => (int) $plan->free_boost_days,
            'early_access' => (bool) $plan->early_access,
            'perks' => $this->normalizePerks($plan->perks ?? []),
            'sort_order' => (int) $plan->sort_order,
            'created_at' => $plan->created_at,
            'updated_at' => $plan->updated_at,
        ];
    }

    private function formatSubscription(UserSubscription $subscription): array
    {
        return [
            'id' => $subscription->id,
            'status' => $subscription->status,
            'starts_at' => $subscription->starts_at,
            'ends_at' => $subscription->ends_at,
            'grace_ends_at' => $subscription->grace_ends_at,
            'plan' => $subscription->plan ? $this->formatPlan($subscription->plan) : null,
        ];
    }

    private function subscriptionUnlocks(?UserSubscription $subscription, bool $assetMarkedFree): bool
    {
        return $assetMarkedFree && $subscription && $subscription->isUsable();
    }

    private function validatePlan(Request $request, ?SubscriptionPlan $plan = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => [
                'nullable',
                'string',
                'max:120',
                Rule::unique('subscription_plans', 'slug')->ignore($plan?->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'monthly_credit_cost' => ['required', 'integer', 'min:0', 'max:100000'],
            'promo_label' => ['nullable', 'string', 'max:80'],
            'promo_credit_cost' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'promo_start_at' => ['nullable', 'date'],
            'promo_end_at' => ['nullable', 'date', 'after_or_equal:promo_start_at'],
            'audience' => ['required', 'string', 'in:wanderer,storyteller'],
            'tier_key' => ['required', 'string', 'in:starter,plus,atelier'],
            'is_recommended' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'unlimited_board' => ['sometimes', 'boolean'],
            'board_limit' => ['required', 'integer', 'min:10', 'max:999'],
            'free_boost_days' => ['required', 'integer', 'min:0', 'max:31'],
            'early_access' => ['sometimes', 'boolean'],
            'perks' => ['nullable'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ]);
    }

    private function normalizePerks(mixed $perks): array
    {
        if (is_string($perks)) {
            $perks = array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $perks)));
        }

        return collect(is_array($perks) ? $perks : [])
            ->map(fn($perk) => trim((string) $perk))
            ->filter()
            ->values()
            ->all();
    }

    private function giftableFromRequest(string $type, string $id): array
    {
        return match ($type) {
            'sticker' => [ArtistSticker::class, ArtistSticker::findOrFail($id)],
            'border' => [ProfileBorder::class, ProfileBorder::findOrFail($id)],
            'design' => [RoyaltyDesignAsset::class, RoyaltyDesignAsset::findOrFail($id)],
        };
    }
}
