<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionRating extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'commission_order_id',
        'commission_service_id',
        'artist_id',
        'customer_id',
        'rating',
        'comment',
        'status',
        'appeal_reason',
        'appealed_at',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'appealed_at' => 'datetime',
            'reviewed_at' => 'datetime',
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

    public function order(): BelongsTo
    {
        return $this->belongsTo(CommissionOrder::class, 'commission_order_id');
    }
}
