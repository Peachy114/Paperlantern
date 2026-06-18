<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Chapter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'work_id',
        'title',
        'content',
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
        'moderation_status',
    ];

    protected function casts(): array
    {
        return [
            'is_locked'        => 'boolean',
            'credits_required' => 'integer',
            'views'            => 'integer',
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
}