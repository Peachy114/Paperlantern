<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ShopItem extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'description',
        'type',
        'labels',
        'status',
        'image_path',
        'download_policy',
        'credit_cost',
        'usage',
        'likes_count',
        'downloads_count',
        'source_art_id',
    ];

    protected function casts(): array
    {
        return [
            'labels' => 'array',
            'usage' => 'array',
            'credit_cost' => 'integer',
            'likes_count' => 'integer',
            'downloads_count' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sourceArt()
    {
        return $this->belongsTo(Art::class, 'source_art_id');
    }

    public function files()
    {
        return $this->hasMany(ShopItemFile::class)->orderBy('sort_order');
    }

    public function purchases()
    {
        return $this->hasMany(ShopItemPurchase::class);
    }

    public static function generateSlug(string $title, string $userId, ?string $excludeId = null): string
    {
        $base = Str::slug($title) ?: 'shop-item';
        $slug = $base;
        $count = 2;

        while (
            static::where('user_id', $userId)
                ->where('slug', $slug)
                ->when($excludeId, fn($query) => $query->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $slug = "{$base}-{$count}";
            $count++;
        }

        return $slug;
    }
}
