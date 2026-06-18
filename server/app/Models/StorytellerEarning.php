<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StorytellerEarning extends Model
{
    protected $fillable = [
        'user_id',
        'balance',       // in credits
        'php_balance',   // converted PHP value
    ];

    protected $casts = [
        'balance'     => 'integer',
        'php_balance' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(EarningTransaction::class, 'storyteller_id');
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(WithdrawalRequest::class, 'user_id');
    }
}