<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommissionOrder extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'commission_service_id',
        'artist_id',
        'customer_id',
        'status',
        'request_message',
        'reference_notes',
        'request_answers',
        'client_details',
        'quote_credits',
        'quote_note',
        'credits_checked',
        'escrow_credits',
        'released_credits',
        'refunded_credits',
        'flow_snapshot',
        'paid_steps',
        'stage_notes',
        'stage_attempts_used',
        'current_step_index',
        'auto_release_at',
        'payment_due_at',
        'final_payment_paid_at',
        'auto_pay_agreed',
        'accepted_at',
        'quote_accepted_at',
        'delivered_at',
        'completed_at',
        'archived_at',
        'cancelled_at',
        'disputed_at',
        'artist_last_read_at',
        'customer_last_read_at',
    ];

    protected function casts(): array
    {
        return [
            'quote_credits' => 'integer',
            'credits_checked' => 'integer',
            'escrow_credits' => 'integer',
            'released_credits' => 'integer',
            'refunded_credits' => 'integer',
            'request_answers' => 'array',
            'client_details' => 'array',
            'flow_snapshot' => 'array',
            'paid_steps' => 'array',
            'stage_notes' => 'array',
            'stage_attempts_used' => 'array',
            'current_step_index' => 'integer',
            'auto_release_at' => 'datetime',
            'payment_due_at' => 'datetime',
            'final_payment_paid_at' => 'datetime',
            'auto_pay_agreed' => 'boolean',
            'accepted_at' => 'datetime',
            'quote_accepted_at' => 'datetime',
            'delivered_at' => 'datetime',
            'completed_at' => 'datetime',
            'archived_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'disputed_at' => 'datetime',
            'artist_last_read_at' => 'datetime',
            'customer_last_read_at' => 'datetime',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(CommissionService::class, 'commission_service_id');
    }

    public function artist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'artist_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(CommissionMessage::class, 'commission_order_id');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(CommissionRevision::class, 'commission_order_id');
    }

    public function deliveryFiles(): HasMany
    {
        return $this->hasMany(CommissionDeliveryFile::class, 'commission_order_id');
    }
}
