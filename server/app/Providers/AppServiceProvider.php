<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Models\Work;
use App\Observers\WorkObserver;
use App\Models\Chapter;
use App\Observers\ChapterObserver;

use App\Repositories\WalletRepository;
use App\Repositories\CreditPackageRepository;
use App\Repositories\PayMongoService;
use App\Repositories\WalletService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
         $this->app->singleton(WalletRepository::class);
         $this->app->singleton(CreditPackageRepository::class);
         $this->app->singleton(PayMongoService::class);
         $this->app->singleton(WalletService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Work::observe(WorkObserver::class);
        Chapter::observe(ChapterObserver::class);
    }
}
