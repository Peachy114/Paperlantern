<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopItemFile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'shop_item_id',
        'file_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'sort_order',
    ];

    protected $hidden = [
        'file_path',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function shopItem()
    {
        return $this->belongsTo(ShopItem::class);
    }
}
