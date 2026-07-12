<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ContentSuspension extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'admin_id',
        'ticket_id',
        'target_type',
        'target_id',
        'target_field',
        'reason',
        'status',
        'hidden_at',
        'restored_at',
    ];

    protected function casts(): array
    {
        return [
            'hidden_at' => 'datetime',
            'restored_at' => 'datetime',
        ];
    }

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

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
