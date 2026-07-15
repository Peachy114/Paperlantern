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
        'description',
        'bundle_name',
        'is_free',
        'credit_cost',
        'is_public',
        'subscription_free',
        'published_at',
        'image_path',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_free' => 'boolean',
            'credit_cost' => 'integer',
            'is_public' => 'boolean',
            'subscription_free' => 'boolean',
            'published_at' => 'datetime',
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
