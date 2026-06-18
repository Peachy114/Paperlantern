<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'wallet_id',
        'user_id',
        'type',           // 'credit' | 'debit'
        'source',         // 'purchase' | 'chapter_unlock' | 'refund'
        'amount',
        'balance_before',
        'balance_after',
        'description',
        'meta',           // JSON: chapter_id, payment_id, etc.
        'reference_id',   // PayMongo payment/link ID
    ];

    protected $casts = [
        'amount'         => 'integer',
        'balance_before' => 'integer',
        'balance_after'  => 'integer',
        'meta'           => 'array',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}