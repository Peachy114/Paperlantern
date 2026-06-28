<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WithdrawalRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'amount_php',
        'credits_redeemed',
        'status',
        'payout_method',
        'payout_details',
        'admin_notes',
        'processed_at',
    ];

    protected $casts = [
        'amount_php'       => 'decimal:2',
        'credits_redeemed' => 'integer',
        'processed_at'     => 'datetime',
    ];

    // Minimum withdrawal in PHP
    const MIN_WITHDRAWAL_PHP = 200.00;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }
}