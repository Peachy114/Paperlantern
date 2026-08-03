<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionQuote extends Model
{
    use HasFactory, HasUuids;

    public const STATUS_PENDING = 'pending';
    public const STATUS_RENEGOTIATION_REQUESTED = 'renegotiation_requested';
    public const STATUS_SUPERSEDED = 'superseded';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_WITHDRAWN = 'withdrawn';

    protected $fillable = [
        'commission_order_id',
        'created_by',
        'version',
        'quote_credits',
        'quote_note',
        'flow_snapshot',
        'status',
        'renegotiation_reason',
        'preferred_credits',
        'requested_changes',
        'renegotiation_requested_at',
        'accepted_at',
        'rejected_at',
        'rejection_reason',
        'superseded_at',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'quote_credits' => 'integer',
            'preferred_credits' => 'integer',
            'flow_snapshot' => 'array',
            'renegotiation_requested_at' => 'datetime',
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
            'superseded_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CommissionOrder::class, 'commission_order_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
