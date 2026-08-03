<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Models\Work;
use App\Observers\WorkObserver;
use App\Models\Chapter;
use App\Observers\ChapterObserver;
use App\Models\CommissionMessage;
use App\Models\CommissionOrder;
use App\Models\CommissionQuote;
use App\Models\ShopItemPurchase;
use App\Observers\CommissionMessageObserver;
use App\Observers\CommissionOrderObserver;
use App\Observers\CommissionQuoteObserver;
use App\Observers\ShopItemPurchaseObserver;

use App\Repositories\WalletRepository;
use App\Repositories\CreditPackageRepository;
use App\Repositories\PayMongoService;
use App\Repositories\WalletService;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(WalletRepository::class);
        $this->app->singleton(CreditPackageRepository::class);
        $this->app->singleton(PayMongoService::class);
        $this->app->singleton(WalletService::class);
    }

    public function boot(): void
    {
        Work::observe(WorkObserver::class);
        Chapter::observe(ChapterObserver::class);

        CommissionOrder::observe(CommissionOrderObserver::class);
        CommissionQuote::observe(CommissionQuoteObserver::class);
        CommissionMessage::observe(CommissionMessageObserver::class);
        ShopItemPurchase::observe(ShopItemPurchaseObserver::class);
    }
}
