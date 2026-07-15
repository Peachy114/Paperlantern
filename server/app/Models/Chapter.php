<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\HasContentSuspensions;

class Chapter extends Model
{
    use HasFactory, SoftDeletes, HasUuids, HasContentSuspensions;

    protected $fillable = [
        'work_id',
        'title',
        'slug',
        'content',
        'artist_note',
        'order',
        'status',
        'cover',
        'scheduled_at',
        'is_locked',
        'credits_required',
        'lock_type',
        'unlocks_at',
        'views',
        'likes',
        'comments_count',
        'super_likes_count',
        'super_like_credits',
        'moderation_status',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public static function generateSlug(string $title, string $workId, ?string $excludeId = null): string
    {
        $base  = \Illuminate\Support\Str::slug($title);
        $slug  = $base;
        $count = 2;

        while (
            static::where('slug', $slug)
                ->where('work_id', $workId)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $slug = "{$base}-{$count}";
            $count++;
        }

        return $slug;
    }

    protected function casts(): array
    {
        return [
            'is_locked'        => 'boolean',
            'credits_required' => 'integer',
            'views'            => 'integer',
            'likes'            => 'integer',
            'comments_count'   => 'integer',
            'super_likes_count' => 'integer',
            'super_like_credits' => 'decimal:2',
            'scheduled_at'     => 'datetime',
            'unlocks_at'       => 'datetime',
        ];
    }

    public function work()
    {
        return $this->belongsTo(Work::class);
    }

    public function images()
    {
        return $this->hasMany(ChapterImage::class)->orderBy('order');
    }

    public function chapterViews()
    {
        return $this->hasMany(ChapterView::class);
    }

    public function chapterLikes()
    {
        return $this->hasMany(ChapterLike::class);
    }

    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
