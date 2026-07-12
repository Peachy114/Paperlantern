<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArtLike extends Model
{
    use HasUuids;

    protected $fillable = [
        'art_id',
        'user_id',
    ];

    public function art(): BelongsTo
    {
        return $this->belongsTo(Art::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
