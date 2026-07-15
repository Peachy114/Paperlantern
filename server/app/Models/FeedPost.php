<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class FeedPost extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'body',
        'audience',
        'comments_enabled',
        'attached_work_id',
        'attached_art_id',
        'attached_commission_service_id',
        'sticker_id',
        'status',
        'likes_count',
        'comments_count',
        'super_likes_count',
        'super_like_credits',
    ];

    protected function casts(): array
    {
        return [
            'comments_enabled' => 'boolean',
            'likes_count' => 'integer',
            'comments_count' => 'integer',
            'super_likes_count' => 'integer',
            'super_like_credits' => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function images()
    {
        return $this->hasMany(FeedPostImage::class)->orderBy('sort_order');
    }

    public function attachedWork()
    {
        return $this->belongsTo(Work::class, 'attached_work_id');
    }

    public function attachedArt()
    {
        return $this->belongsTo(Art::class, 'attached_art_id');
    }

    public function attachedCommissionService()
    {
        return $this->belongsTo(CommissionService::class, 'attached_commission_service_id');
    }

    public function sticker()
    {
        return $this->belongsTo(ArtistSticker::class, 'sticker_id');
    }

    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function superLikes(): MorphMany
    {
        return $this->morphMany(SuperLike::class, 'super_likeable');
    }

    public function likes()
    {
        return $this->hasMany(FeedPostLike::class);
    }
}
