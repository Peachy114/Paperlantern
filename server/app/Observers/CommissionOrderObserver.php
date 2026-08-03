<?php

namespace App\Observers;

use App\Models\CommissionOrder;
use App\Services\AppNotificationService;
use Illuminate\Support\Facades\DB;

class CommissionOrderObserver
{
    public function __construct(
        private AppNotificationService $notifications
    ) {}

    public function created(CommissionOrder $order): void
    {
        if (! $order->commission_service_id) {
            return;
        }

        $orderId = $order->id;

        DB::afterCommit(function () use ($orderId): void {
            $order = CommissionOrder::query()
                ->with([
                    'service:id,title',
                    'artist:id,name,username,avatar,email',
                    'customer:id,name,username,avatar',
                ])
                ->find($orderId);

            if (! $order?->artist || ! $order->customer) {
                return;
            }

            $customerName = $order->customer->name
                ?: $order->customer->username
                ?: 'A Wanderer';

            $serviceTitle = $order->service?->title
                ?? 'your commission service';

            $this->notifications->notify(
                $order->artist,
                'commissions',
                'New commission request',
                "{$customerName} requested {$serviceTitle}.",
                "/messages?order={$order->id}",
                [
                    'section' => 'commissions',

                    'actor_id' => $order->customer->id,
                    'actor_name' => $order->customer->name,
                    'actor_username' => $order->customer->username,
                    'actor_avatar' => $order->customer->avatar,

                    'resource_type' => 'commission_order',
                    'resource_id' => $order->id,
                    'order_id' => $order->id,

                    'email_action_label' => 'Review commission request',
                ]
            );
        });
    }
}
