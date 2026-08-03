<?php

namespace App\Observers;

use App\Models\CommissionQuote;
use App\Services\AppNotificationService;
use Illuminate\Support\Facades\DB;

class CommissionQuoteObserver
{
    public function __construct(private AppNotificationService $notifications) {}

    public function created(CommissionQuote $quote): void
    {
        $quoteId = $quote->id;

        DB::afterCommit(function () use ($quoteId) {
            $quote = CommissionQuote::query()
                ->with([
                    'order.service:id,title',
                    'order.artist:id,name,username,avatar',
                    'order.customer:id,name,username,avatar,email',
                    'creator:id,name,username,avatar',
                ])
                ->find($quoteId);

            $order = $quote?->order;
            if (! $quote || ! $order?->customer || ! $order->artist) return;

            $artistName = $order->artist->name ?: $order->artist->username ?: 'The artist';
            $changed = (int) $quote->version > 1;

            $this->notifications->notify(
                $order->customer,
                'commissions',
                $changed ? 'Commission quote changed' : 'New commission quote',
                "{$artistName} sent Quote Version {$quote->version} for {$quote->quote_credits} credits.",
                "/messages?order={$order->id}",
                [
                    'section' => 'commissions',
                    'actor_id' => $order->artist->id,
                    'actor_name' => $order->artist->name,
                    'actor_username' => $order->artist->username,
                    'actor_avatar' => $order->artist->avatar,
                    'resource_type' => 'commission_quote',
                    'resource_id' => $quote->id,
                    'order_id' => $order->id,
                    'quote_id' => $quote->id,
                    'email_action_label' => 'Review quote',
                ]
            );
        });
    }

    public function updated(CommissionQuote $quote): void
    {
        if (! $quote->wasChanged('status')) return;

        if (! in_array($quote->status, [
            CommissionQuote::STATUS_RENEGOTIATION_REQUESTED,
            CommissionQuote::STATUS_ACCEPTED,
            CommissionQuote::STATUS_REJECTED,
        ], true)) return;

        $quoteId = $quote->id;

        DB::afterCommit(function () use ($quoteId) {
            $quote = CommissionQuote::query()
                ->with([
                    'order.artist:id,name,username,avatar,email',
                    'order.customer:id,name,username,avatar',
                ])
                ->find($quoteId);

            $order = $quote?->order;
            if (! $quote || ! $order?->artist || ! $order->customer) return;

            $customerName = $order->customer->name ?: $order->customer->username ?: 'The Wanderer';

            [$title, $body] = match ($quote->status) {
                CommissionQuote::STATUS_RENEGOTIATION_REQUESTED => [
                    'New quote requested',
                    $quote->preferred_credits !== null
                        ? "{$customerName} requested another quote. Preferred budget: {$quote->preferred_credits} credits."
                        : "{$customerName} requested another commission quote.",
                ],
                CommissionQuote::STATUS_ACCEPTED => [
                    'Commission quote accepted',
                    "{$customerName} accepted Quote Version {$quote->version} for {$quote->quote_credits} credits.",
                ],
                CommissionQuote::STATUS_REJECTED => [
                    'Commission quote rejected',
                    "{$customerName} rejected Quote Version {$quote->version}.",
                ],
                default => [null, null],
            };

            if (! $title) return;

            $this->notifications->notify(
                $order->artist,
                'commissions',
                $title,
                $body,
                "/messages?order={$order->id}",
                [
                    'section' => 'commissions',
                    'actor_id' => $order->customer->id,
                    'actor_name' => $order->customer->name,
                    'actor_username' => $order->customer->username,
                    'actor_avatar' => $order->customer->avatar,
                    'resource_type' => 'commission_quote',
                    'resource_id' => $quote->id,
                    'order_id' => $order->id,
                    'quote_id' => $quote->id,
                    'email_action_label' => 'Open commission conversation',
                ]
            );
        });
    }
}
