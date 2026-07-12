<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditPaymentSession extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'user_id',
        'credit_package_id',
        'provider',
        'provider_mode',
        'reference_id',
        'checkout_url',
        'status',
        'currency',
        'amount',
        'credits',
        'description',
        'paid_at',
        'failed_at',
        'expired_at',
        'expires_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'credits' => 'integer',
            'paid_at' => 'datetime',
            'failed_at' => 'datetime',
            'expired_at' => 'datetime',
            'expires_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(CreditPackage::class, 'credit_package_id');
    }
}
