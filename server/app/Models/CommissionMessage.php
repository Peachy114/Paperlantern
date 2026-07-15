<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionMessage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'commission_order_id',
        'sender_id',
        'body',
        'kind',
        'upload_type',
        'stage_index',
        'approval_status',
        'delivery_file_id',
        'image_path',
        'image_moderation_status',
    ];

    protected function casts(): array
    {
        return [
            'stage_index' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CommissionOrder::class, 'commission_order_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function deliveryFile(): BelongsTo
    {
        return $this->belongsTo(CommissionDeliveryFile::class, 'delivery_file_id');
    }
}
