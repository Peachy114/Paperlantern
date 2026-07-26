<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Models\ChapterView;
use App\Models\Concerns\HasContentSuspensions;

class Work extends Model
{
    use HasFactory, SoftDeletes, HasUuids, HasContentSuspensions;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'type',
        'slug',
        'genres',
        'content_rating_assessment',
        'language',
        'cover',
        'banner',
        'status',
        'moderation_status',
        'schedule',
        'schedule_time',
        'next_chapter_at',
        'views',
        'likes',
        'work_likes_count',
        'favorites_count',
        'comments_count',
        'super_likes_count',
        'super_like_credits',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'genres'          => 'array',
            'content_rating_assessment' => 'array',
            'next_chapter_at' => 'date',
            'views'           => 'integer',
            'likes'           => 'integer',
            'work_likes_count' => 'integer',
            'favorites_count' => 'integer',
            'comments_count'  => 'integer',
            'super_likes_count' => 'integer',
            'super_like_credits' => 'decimal:2',
            'is_featured' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function chapters()
    {
        return $this->hasMany(Chapter::class)->orderBy('order');
    }

    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function workLikes()
    {
        return $this->hasMany(WorkLike::class);
    }

    public function favorites()
    {
        return $this->hasMany(WorkFavorite::class);
    }

    public function chapterViews(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(ChapterView::class, Chapter::class);
    }

    public static function generateSlug(string $title, ?string $excludeId = null): string
    {
        $base  = Str::slug($title);
        $slug  = $base;
        $count = 2;

        while (
            static::where('slug', $slug)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $slug = "{$base}-{$count}";
            $count++;
        }

        return $slug;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

}
