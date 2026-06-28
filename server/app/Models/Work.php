<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Work extends Model
{
    use HasFactory, SoftDeletes, HasUuids;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'type',
        'slug',
        'genres',
        'cover',
        'banner',
        'status',
        'moderation_status',
        'schedule',
        'schedule_time',
        'next_chapter_at',
        'views',
        'likes',
    ];

    protected function casts(): array
    {
        return [
            'genres'          => 'array',
            'next_chapter_at' => 'date',
            'views'           => 'integer',
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