<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopItemRating extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'shop_item_id',
        'user_id',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
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
