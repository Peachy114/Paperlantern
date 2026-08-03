<?php

namespace App\Observers;

use App\Models\CommissionMessage;
use App\Services\AppNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CommissionMessageObserver
{
    public function __construct(private AppNotificationService $notifications) {}

    public function created(CommissionMessage $message): void
    {
        if (($message->kind ?? 'message') === 'system') return;
        $messageId = $message->id;

        DB::afterCommit(function () use ($messageId) {
            $message = CommissionMessage::query()
                ->with([
                    'sender:id,name,username,avatar',
                    'order.artist:id,name,username,avatar,email',
                    'order.customer:id,name,username,avatar,email',
                ])
                ->find($messageId);

            $order = $message?->order;
            $sender = $message?->sender;
            if (! $message || ! $order || ! $sender) return;
            if ($this->isInitialCommissionRequestMessage($message)) return;

            $recipient = (string) $message->sender_id === (string) $order->artist_id
                ? $order->customer
                : $order->artist;
            if (! $recipient) return;

            $kind = $message->kind ?? 'message';
            $senderName = $sender->name ?: $sender->username ?: 'Someone';

            if ($kind === 'final_delivery') {
                $category = 'commissions';
                $title = 'Final delivery ready';
                $body = "{$senderName} uploaded the final commission delivery.";
            } elseif ($kind === 'stage_submission') {
                $category = 'commissions';
                $title = 'Commission submission ready';
                $body = "{$senderName} submitted a new {$message->upload_type} update.";
            } else {
                $category = 'messages';
                $title = "New message from {$senderName}";
                $body = $message->body ? Str::limit(trim($message->body), 180) : 'Sent an image.';
            }

            $this->notifications->notify(
                $recipient,
                $category,
                $title,
                $body,
                "/messages?order={$order->id}",
                [
                    'section' => $category === 'messages' ? 'messages' : 'commissions',
                    'actor_id' => $sender->id,
                    'actor_name' => $sender->name,
                    'actor_username' => $sender->username,
                    'actor_avatar' => $sender->avatar,
                    'resource_type' => 'commission_message',
                    'resource_id' => $message->id,
                    'order_id' => $order->id,
                    'message_id' => $message->id,
                    'skip_email' => $category === 'messages',
                    'email_action_label' => 'Open conversation',
                ]
            );
        });
    }

    private function isInitialCommissionRequestMessage(CommissionMessage $message): bool
    {
        $order = $message->order;

        if (
            ! $order?->commission_service_id
            || ! $order->created_at
            || ! $message->created_at
            || $order->created_at->diffInSeconds($message->created_at) > 15
        ) return false;

        return trim((string) $message->body) === trim((string) $order->request_message)
            || trim((string) $message->body) === 'Reference image attached from the commission request.';
    }
}
