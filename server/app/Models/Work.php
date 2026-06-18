<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Work extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'type',
        'genres',
        'cover',
        'banner',
        'status',
        'moderation_status',
        'schedule',
        'schedule_time',
        'next_chapter_at',
        'views',
        'likes'
    ];

    protected function casts(): array
    {
        return [
            'genres'          => 'array',   // JSON → array automatically
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
}