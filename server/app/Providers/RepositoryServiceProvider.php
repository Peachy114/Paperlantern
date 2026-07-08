<?php

namespace App\Providers;

use App\Repositories\SubscriberRepository;
use App\Repositories\SubscriberRepositoryInterface;
use App\Services\SubscriberService;
use App\Services\SubscriberServiceInterface;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SubscriberRepositoryInterface::class, SubscriberRepository::class);
        $this->app->bind(SubscriberServiceInterface::class, SubscriberService::class);
    }
}