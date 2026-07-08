<?php

namespace App\Repositories;

use App\Models\Subscriber;

class SubscriberRepository implements SubscriberRepositoryInterface
{
    public function findByEmail(string $email): ?Subscriber
    {
        return Subscriber::where('email', $email)->first();
    }

    public function create(array $data): Subscriber
    {
        return Subscriber::create($data);
    }
}