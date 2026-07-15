<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionDeliveryFile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'commission_order_id',
        'uploaded_by',
        'file_path',
        'preview_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'note',
        'moderation_status',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CommissionOrder::class, 'commission_order_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
