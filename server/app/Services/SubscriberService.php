<?php

namespace App\Services;

use App\Mail\SubscriptionConfirmed;
use App\Repositories\SubscriberRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SubscriberService implements SubscriberServiceInterface
{
    public function __construct(
        private readonly SubscriberRepositoryInterface $subscribers
    ) {}

    public function subscribe(string $email): array
    {
        $existing = $this->subscribers->findByEmail($email);

        if ($existing) {
            return [
                'status' => 'already_subscribed',
                'subscriber' => $existing,
            ];
        }

        $subscriber = $this->subscribers->create([
            'email' => $email,
            'agreed_at' => now(),
        ]);

        $this->sendConfirmationEmail($subscriber->email);

        return [
            'status' => 'created',
            'subscriber' => $subscriber,
        ];
    }

    private function sendConfirmationEmail(string $email): void
    {
        try {
            Mail::to($email)->send(new SubscriptionConfirmed());
        } catch (\Throwable $e) {
            // Don't fail the subscription just because the email didn't send.
            Log::error('Subscription email failed: ' . $e->getMessage());
        }
    }
}