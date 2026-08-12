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

    protected static function booted(): void
    {
        /*
         * Stickers created by a super admin are the application's default
         * stickers. They belong to every user, so they must never become
         * paywalled or hidden because of form values or a stale migration.
         */
        static::saving(function (ArtistSticker $sticker): void {
            if (! $sticker->user_id) {
                return;
            }

            $isDefaultSticker = User::query()
                ->whereKey($sticker->user_id)
                ->where('role', 'super_admin')
                ->exists();

            if (! $isDefaultSticker) {
                return;
            }

            $sticker->is_public = true;
            $sticker->is_free = true;
            $sticker->credit_cost = 0;
            $sticker->published_at ??= now();
        });
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
