<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Models\Concerns\HasContentSuspensions;

class Art extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasContentSuspensions;

    protected $table = 'arts';

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'description',
        'labels',
        'image_path',
        'status',
        'moderation_status',
        'views',
        'likes',
        'comments_count',
        'super_likes_count',
        'super_like_credits',
        'public_sort_order',
    ];

    protected function casts(): array
    {
        return [
            'views' => 'integer',
            'likes' => 'integer',
            'comments_count' => 'integer',
            'super_likes_count' => 'integer',
            'super_like_credits' => 'decimal:2',
            'public_sort_order' => 'integer',
            'labels' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function images()
    {
        return $this->hasMany(ArtImage::class)->orderBy('sort_order');
    }

    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public static function generateSlug(string $title, string $userId, ?string $excludeId = null): string
    {
        $base = Str::slug($title);
        $base = $base !== '' ? $base : 'art';
        $slug = $base;
        $count = 2;

        while (
            static::where('user_id', $userId)
                ->where('slug', $slug)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $slug = "{$base}-{$count}";
            $count++;
        }

        return $slug;
    }
}
