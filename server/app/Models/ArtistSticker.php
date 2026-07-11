<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArtistSticker extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'name',
        'image_path',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(ArtistStickerSubscription::class);
    }

    public function purchases()
    {
        return $this->hasMany(ArtistStickerPurchase::class);
    }

    public function profileBlocks()
    {
        return $this->hasMany(ArtistProfileBlock::class, 'source_sticker_id');
    }
}
