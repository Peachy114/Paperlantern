<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChapterRevision extends Model
{
    use HasUuids;

    protected $fillable = [
        'chapter_id',
        'user_id',
        'source',
        'title',
        'content',
        'artist_note',
        'word_count',
    ];

    protected function casts(): array
    {
        return [
            'word_count' => 'integer',
        ];
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
