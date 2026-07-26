<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Announcement extends Model
{
    use HasUuids;

    protected $fillable = [
        'created_by',
        'title',
        'content',
        'tag',
        'is_event',
        'audience',
        'page_targets',
        'placement',
        'is_public',
        'image',
        'is_pinned',
        'is_featured',
        'rotation_seconds',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_event' => 'boolean',
        'is_featured' => 'boolean',
        'is_public' => 'boolean',
        'page_targets' => 'array',
        'rotation_seconds' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
