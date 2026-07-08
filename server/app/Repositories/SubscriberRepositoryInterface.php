<?php

namespace App\Repositories;

use App\Models\Subscriber;

interface SubscriberRepositoryInterface
{
    public function findByEmail(string $email): ?Subscriber;

    public function create(array $data): Subscriber;
}