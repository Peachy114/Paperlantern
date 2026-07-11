<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'commentable_type',
        'commentable_id',
        'body',
        'artist_sticker_id',
        'status',
        'public_highlight',
        'super_likes_count',
        'super_like_credits',
    ];

    protected function casts(): array
    {
        return [
            'super_likes_count' => 'integer',
            'super_like_credits' => 'decimal:2',
            'public_highlight' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function sticker(): BelongsTo
    {
        return $this->belongsTo(ArtistSticker::class, 'artist_sticker_id');
    }
}
