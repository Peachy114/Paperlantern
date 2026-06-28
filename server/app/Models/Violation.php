<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Violation extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'admin_id',
        'target_type',
        'target_id',
        'reason',
        'strike_number',
        'resulted_in_ban',
    ];

    protected $casts = [
        'resulted_in_ban' => 'boolean',
    ];

    public function target(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}