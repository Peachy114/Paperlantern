<?php

namespace App\Services;

interface SubscriberServiceInterface
{
    /**
     * Subscribe an email. Returns an array with:
     * - 'status': 'created' | 'already_subscribed'
     * - 'subscriber': the Subscriber model
     */
    public function subscribe(string $email): array;
}