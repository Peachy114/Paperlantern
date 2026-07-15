<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionRevision extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'commission_order_id',
        'requested_by',
        'reason',
        'revision_number',
        'requested_step_index',
        'requested_step_type',
        'extra_attempt_credits',
        'status',
        'artist_response',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'revision_number' => 'integer',
            'requested_step_index' => 'integer',
            'extra_attempt_credits' => 'integer',
            'resolved_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CommissionOrder::class, 'commission_order_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
