<?php

namespace App\Services;

use App\Models\ArtistSticker;
use App\Models\User;
use App\Repositories\WalletRepository;
use Illuminate\Support\Facades\DB;

class ArtistStickerLibraryService
{
    public const PURCHASE_COST = 1;

    public function __construct(
        private WalletRepository $walletRepo,
        private CommissionService $commissionService,
    ) {}

    public function artistStore(User $artist, ?User $viewer = null)
    {
        return $artist->artistStickers()
            ->withCount(['subscriptions', 'purchases'])
            ->paginate(40)
            ->through(fn(ArtistSticker $sticker) => $this->format($sticker, $viewer));
    }

    public function userLibrary(User $user): array
    {
        $stickers = ArtistSticker::query()
            ->where('user_id', $user->id)
            ->orWhereHas('purchases', fn($q) => $q->where('user_id', $user->id))
            ->orWhereHas('subscriptions', fn($q) => $q->where('user_id', $user->id))
            ->with('user:id,name,username,avatar')
            ->withCount(['subscriptions', 'purchases'])
            ->orderBy('sort_order')
            ->get();

        return [
            'data' => $stickers->map(fn(ArtistSticker $sticker) => $this->format($sticker, $user))->values(),
        ];
    }

    public function subscribe(User $user, ArtistSticker $sticker): array
    {
        $sticker->subscriptions()->firstOrCreate(['user_id' => $user->id]);

        return $this->format($sticker->fresh()->load('user')->loadCount(['subscriptions', 'purchases']), $user);
    }

    public function purchase(User $user, ArtistSticker $sticker): array
    {
        if ($user->purchasedArtistStickers()->where('artist_stickers.id', $sticker->id)->exists()) {
            return $this->format($sticker->load('user')->loadCount(['subscriptions', 'purchases']), $user);
        }

        abort_if($sticker->user_id === $user->id, 422, 'You already own this sticker.');

        DB::transaction(function () use ($user, $sticker) {
            $wallet = $this->walletRepo->findOrCreateByUser($user->id);
            $debit = $this->walletRepo->debit($wallet, self::PURCHASE_COST, [
                'source' => 'bonus',
                'description' => "Bought sticker - {$sticker->name}",
                'meta' => [
                    'kind' => 'sticker_purchase',
                    'artist_sticker_id' => $sticker->id,
                ],
            ]);

            if ($debit === false) {
                abort(402, 'Not enough credits to buy this sticker.');
            }

            $sticker->purchases()->create([
                'user_id' => $user->id,
                'credits_spent' => self::PURCHASE_COST,
            ]);

            $sticker->loadMissing('user');
            if ($sticker->user) {
                $this->commissionService->recordEarning(
                    $user,
                    $sticker->user,
                    self::PURCHASE_COST,
                    'sticker_purchase',
                    $sticker,
                );
            }
        });

        return $this->format($sticker->fresh()->load('user')->loadCount(['subscriptions', 'purchases']), $user);
    }

    private function format(ArtistSticker $sticker, ?User $viewer = null): array
    {
        $owned = $viewer && $sticker->user_id === $viewer->id;
        $bought = $viewer
            ? $viewer->purchasedArtistStickers()->where('artist_stickers.id', $sticker->id)->exists()
            : false;
        $subscribed = $viewer
            ? $viewer->subscribedArtistStickers()->where('artist_stickers.id', $sticker->id)->exists()
            : false;

        return [
            'id' => $sticker->id,
            'user_id' => $sticker->user_id,
            'name' => $sticker->name,
            'image_path' => $sticker->image_path,
            'sort_order' => $sticker->sort_order,
            'subscriptions_count' => (int) ($sticker->subscriptions_count ?? 0),
            'purchases_count' => (int) ($sticker->purchases_count ?? 0),
            'owned' => $owned,
            'bought' => $bought,
            'subscribed' => $subscribed,
            'can_use' => $owned || $bought || $subscribed,
            'purchase_cost' => self::PURCHASE_COST,
            'owner' => $sticker->relationLoaded('user') && $sticker->user ? [
                'id' => $sticker->user->id,
                'name' => $sticker->user->name,
                'username' => $sticker->user->username,
                'avatar' => $sticker->user->avatar,
            ] : null,
        ];
    }
}
