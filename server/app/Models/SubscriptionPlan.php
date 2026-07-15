<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'audience',
        'tier_key',
        'description',
        'monthly_credit_cost',
        'promo_label',
        'promo_credit_cost',
        'promo_start_at',
        'promo_end_at',
        'is_recommended',
        'is_active',
        'unlimited_board',
        'board_limit',
        'free_boost_days',
        'early_access',
        'perks',
        'sort_order',
    ];

    protected $casts = [
        'monthly_credit_cost' => 'integer',
        'promo_credit_cost' => 'integer',
        'promo_start_at' => 'datetime',
        'promo_end_at' => 'datetime',
        'is_recommended' => 'boolean',
        'is_active' => 'boolean',
        'unlimited_board' => 'boolean',
        'board_limit' => 'integer',
        'free_boost_days' => 'integer',
        'early_access' => 'boolean',
        'perks' => 'array',
        'sort_order' => 'integer',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class);
    }

    public function promoIsActive(): bool
    {
        return $this->promo_credit_cost !== null
            && (! $this->promo_start_at || $this->promo_start_at->isPast())
            && (! $this->promo_end_at || $this->promo_end_at->isFuture());
    }

    public function effectiveCreditCost(): int
    {
        return $this->promoIsActive()
            ? (int) $this->promo_credit_cost
            : (int) $this->monthly_credit_cost;
    }
}
