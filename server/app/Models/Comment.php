<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'parent_id',
        'commentable_type',
        'commentable_id',
        'body',
        'artist_sticker_id',
        'reaction_emoji',
        'gif_url',
        'image_url',
        'image_path',
        'image_moderation_status',
        'is_spoiler',
        'is_pinned',
        'likes_count',
        'replies_count',
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
            'is_spoiler' => 'boolean',
            'is_pinned' => 'boolean',
            'likes_count' => 'integer',
            'replies_count' => 'integer',
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

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id')->latest();
    }

    public function likes(): HasMany
    {
        return $this->hasMany(CommentLike::class);
    }

    public function superLikes(): MorphMany
    {
        return $this->morphMany(SuperLike::class, 'super_likeable');
    }

    public function sticker(): BelongsTo
    {
        return $this->belongsTo(ArtistSticker::class, 'artist_sticker_id');
    }
}
