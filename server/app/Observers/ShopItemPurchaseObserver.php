<?php

namespace App\Observers;

use App\Models\ShopItemPurchase;
use App\Services\AppNotificationService;
use Illuminate\Support\Facades\DB;

class ShopItemPurchaseObserver
{
    public function __construct(private AppNotificationService $notifications) {}

    public function created(ShopItemPurchase $purchase): void
    {
        $purchaseId = $purchase->id;

        DB::afterCommit(function () use ($purchaseId) {
            $purchase = ShopItemPurchase::query()
                ->with([
                    'shopItem.user:id,name,username,avatar,email',
                    'user:id,name,username,avatar',
                ])
                ->find($purchaseId);

            $item = $purchase?->shopItem;
            $seller = $item?->user;
            $buyer = $purchase?->user;
            if (! $purchase || ! $item || ! $seller || ! $buyer) return;

            $buyerName = $buyer->name ?: $buyer->username ?: 'A customer';

            $this->notifications->notify(
                $seller,
                'new_purchase',
                'New shop purchase',
                "{$buyerName} unlocked {$item->title} for {$purchase->credit_cost} credits.",
                "/my-shop?tab=sales&item={$item->id}",
                [
                    'section' => 'shop',
                    'actor_id' => $buyer->id,
                    'actor_name' => $buyer->name,
                    'actor_username' => $buyer->username,
                    'actor_avatar' => $buyer->avatar,
                    'resource_type' => 'shop_item_purchase',
                    'resource_id' => $purchase->id,
                    'shop_item_id' => $item->id,
                    'email_action_label' => 'View shop sales',
                ]
            );
        });
    }
}
