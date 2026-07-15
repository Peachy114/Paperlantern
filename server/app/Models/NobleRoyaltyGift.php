<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class NobleRoyaltyGift extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'giver_id',
        'recipient_id',
        'giftable_type',
        'giftable_id',
        'note',
    ];

    public function giver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'giver_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function giftable(): MorphTo
    {
        return $this->morphTo();
    }
}
