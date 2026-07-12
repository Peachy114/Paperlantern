<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SuperLike extends Model
{
    use HasUuids;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'super_like_award_id',
        'super_likeable_type',
        'super_likeable_id',
        'credits_spent',
        'receiver_cut',
        'platform_cut',
    ];

    protected function casts(): array
    {
        return [
            'credits_spent' => 'decimal:2',
            'receiver_cut' => 'decimal:2',
            'platform_cut' => 'decimal:2',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function award(): BelongsTo
    {
        return $this->belongsTo(SuperLikeAward::class, 'super_like_award_id');
    }

    public function superLikeable(): MorphTo
    {
        return $this->morphTo();
    }
}
