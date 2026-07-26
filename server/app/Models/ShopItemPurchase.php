<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopItemPurchase extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'shop_item_id',
        'credit_cost',
    ];

    protected function casts(): array
    {
        return [
            'credit_cost' => 'integer',
        ];
    }

    public function shopItem()
    {
        return $this->belongsTo(ShopItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
