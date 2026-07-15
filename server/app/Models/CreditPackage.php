<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditPackage extends Model
{
    protected $fillable = [
        'name',
        'credits',
        'price',
        'promo_label',
        'promo_start_at',
        'promo_end_at',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'credits'        => 'integer',
        'price'          => 'decimal:2',
        'promo_start_at' => 'datetime',
        'promo_end_at'   => 'datetime',
        'is_active'      => 'boolean',
    ];

    public function isAvailableForPurchase(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();

        if ($this->promo_start_at && $this->promo_start_at->isFuture()) {
            return false;
        }

        if ($this->promo_end_at && $this->promo_end_at->isPast()) {
            return false;
        }

        return true;
    }
}
