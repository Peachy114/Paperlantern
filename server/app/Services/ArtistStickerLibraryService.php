<?php

namespace App\Services;

use App\Models\ArtistSticker;
use App\Models\NobleRoyaltyGift;
use App\Models\User;
use App\Models\UserSubscription;
use App\Repositories\WalletRepository;
use Illuminate\Support\Facades\DB;

class ArtistStickerLibraryService
{
    public function __construct(
        private WalletRepository $walletRepo,
        private CommissionService $commissionService,
    ) {}

    public function artistStore(User $artist, ?User $viewer = null)
    {
        return $artist->artistStickers()
            ->where(function ($query) use ($artist, $viewer) {
                $query->where('is_public', true);

                if ($viewer && $viewer->id === $artist->id) {
                    $query->orWhere('user_id', $artist->id);
                }
            })
            ->with('user:id,name,username,avatar,role')
            ->withCount(['subscriptions', 'purchases'])
            ->paginate(40)
            ->through(fn(ArtistSticker $sticker) => $this->format($sticker, $viewer));
    }

    public function userLibrary(User $user): array
    {
        $giftedIds = NobleRoyaltyGift::where('recipient_id', $user->id)
            ->where('giftable_type', ArtistSticker::class)
            ->pluck('giftable_id');

        $hasSubscription = UserSubscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->where(fn($query) => $query
                ->whereNull('ends_at')
                ->orWhere('ends_at', '>', now()))
            ->exists();

        $stickers = ArtistSticker::query()
            ->where(function ($query) use ($user, $giftedIds, $hasSubscription) {
                $query
                    // Stickers created by this user.
                    ->where('user_id', $user->id)

                    // Stickers explicitly bought by this user.
                    ->orWhereHas('purchases', fn($q) => $q->where('user_id', $user->id))

                    // Stickers explicitly subscribed to by this user.
                    ->orWhereHas('subscriptions', fn($q) => $q->where('user_id', $user->id))

                    // Stickers gifted to this user.
                    ->orWhereIn('id', $giftedIds)

                    // Public/free creator stickers.
                    ->orWhere(fn($inner) => $inner
                        ->where('is_public', true)
                        ->where('is_free', true))

                    // Super-admin stickers are application defaults and belong
                    // to every user regardless of stale pricing flags.
                    ->orWhereHas('user', fn($owner) => $owner->where('role', 'super_admin'));

                if ($hasSubscription) {
                    $query->orWhere(fn($inner) => $inner
                        ->where('is_public', true)
                        ->where('subscription_free', true));
                }
            })
            ->with('user:id,name,username,avatar,role')
            ->withCount(['subscriptions', 'purchases'])
            ->orderBy('sort_order')
            ->get();

        return [
            'data' => $stickers
                ->map(fn(ArtistSticker $sticker) => $this->format($sticker, $user))
                ->values(),
        ];
    }

    public function subscribe(User $user, ArtistSticker $sticker): array
    {
        $sticker->loadMissing('user:id,name,username,avatar,role');

        // Default stickers already belong to every user. Do not create
        // meaningless subscription rows for them.
        if ($this->isDefaultSticker($sticker)) {
            return $this->format(
                $sticker->loadCount(['subscriptions', 'purchases']),
                $user
            );
        }

        abort_unless($sticker->is_public, 404);

        $sticker->subscriptions()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        return $this->format(
            $sticker->fresh()
                ->load('user:id,name,username,avatar,role')
                ->loadCount(['subscriptions', 'purchases']),
            $user
        );
    }

    public function purchase(User $user, ArtistSticker $sticker): array
    {
        $sticker->loadMissing('user:id,name,username,avatar,role');

        // Default stickers are globally owned and must never charge credits.
        if ($this->isDefaultSticker($sticker)) {
            return $this->format(
                $sticker->loadCount(['subscriptions', 'purchases']),
                $user
            );
        }

        if ($user->purchasedArtistStickers()
            ->where('artist_stickers.id', $sticker->id)
            ->exists()
        ) {
            return $this->format(
                $sticker->loadCount(['subscriptions', 'purchases']),
                $user
            );
        }

        abort_unless($sticker->is_public, 404);
        abort_if($sticker->user_id === $user->id, 422, 'You already own this sticker.');

        $cost = $this->purchaseCost($sticker);

        DB::transaction(function () use ($user, $sticker, $cost) {
            if ($cost > 0) {
                $wallet = $this->walletRepo->findOrCreateByUser($user->id);
                $debit = $this->walletRepo->debit($wallet, $cost, [
                    'source' => 'bonus',
                    'description' => "Bought sticker - {$sticker->name}",
                    'meta' => [
                        'kind' => 'sticker_purchase',
                        'artist_sticker_id' => $sticker->id,
                        'bundle_name' => $sticker->bundle_name,
                    ],
                ]);

                if ($debit === false) {
                    abort(402, 'Not enough credits to buy this sticker.');
                }
            }

            $sticker->purchases()->create([
                'user_id' => $user->id,
                'credits_spent' => $cost,
            ]);

            $sticker->loadMissing('user:id,name,username,avatar,role');

            if ($sticker->user && $cost > 0) {
                $this->commissionService->recordEarning(
                    $user,
                    $sticker->user,
                    $cost,
                    'sticker_purchase',
                    $sticker,
                );
            }
        });

        return $this->format(
            $sticker->fresh()
                ->load('user:id,name,username,avatar,role')
                ->loadCount(['subscriptions', 'purchases']),
            $user
        );
    }

    private function format(ArtistSticker $sticker, ?User $viewer = null): array
    {
        $sticker->loadMissing('user:id,name,username,avatar,role');

        $isDefault = $this->isDefaultSticker($sticker);
        $owned = $viewer && $sticker->user_id === $viewer->id;

        $bought = $viewer
            ? $viewer->purchasedArtistStickers()
            ->where('artist_stickers.id', $sticker->id)
            ->exists()
            : false;

        $subscribed = $viewer
            ? $viewer->subscribedArtistStickers()
            ->where('artist_stickers.id', $sticker->id)
            ->exists()
            : false;

        $gifted = $viewer
            ? NobleRoyaltyGift::where('recipient_id', $viewer->id)
            ->where('giftable_type', ArtistSticker::class)
            ->where('giftable_id', $sticker->id)
            ->exists()
            : false;

        $subscriptionUnlocked = $viewer
            ? (bool) $sticker->subscription_free
            && UserSubscription::where('user_id', $viewer->id)
            ->where('status', 'active')
            ->where(fn($query) => $query
                ->whereNull('ends_at')
                ->orWhere('ends_at', '>', now()))
            ->exists()
            : false;

        return [
            'id' => $sticker->id,
            'user_id' => $sticker->user_id,
            'name' => $sticker->name,
            'description' => $sticker->description,
            'bundle_name' => $sticker->bundle_name,
            'is_free' => $isDefault || (bool) $sticker->is_free,
            'credit_cost' => $this->purchaseCost($sticker),
            'is_public' => $isDefault || (bool) $sticker->is_public,
            'subscription_free' => (bool) $sticker->subscription_free,
            'published_at' => $sticker->published_at,
            'image_path' => $sticker->image_path,
            'sort_order' => $sticker->sort_order,
            'subscriptions_count' => (int) ($sticker->subscriptions_count ?? 0),
            'purchases_count' => (int) ($sticker->purchases_count ?? 0),
            'owned' => $owned || $isDefault,
            'bought' => $bought,
            'subscribed' => $subscribed,
            'gifted' => $gifted,
            'subscription_unlocked' => $subscriptionUnlocked,
            'can_use' =>
            $isDefault
                || $owned
                || $bought
                || $subscribed
                || $gifted
                || $subscriptionUnlocked
                || ((bool) $sticker->is_public && (bool) $sticker->is_free),
            'purchase_cost' => $this->purchaseCost($sticker),
            'owner' => $sticker->user ? [
                'id' => $sticker->user->id,
                'name' => $sticker->user->name,
                'username' => $sticker->user->username,
                'avatar' => $sticker->user->avatar,
            ] : null,
        ];
    }

    private function purchaseCost(ArtistSticker $sticker): int
    {
        if ($this->isDefaultSticker($sticker) || $sticker->is_free) {
            return 0;
        }

        return max(1, (int) ($sticker->credit_cost ?? 1));
    }

    private function isDefaultSticker(ArtistSticker $sticker): bool
    {
        $sticker->loadMissing('user:id,name,username,avatar,role');

        return $sticker->user?->role === 'super_admin';
    }
}
