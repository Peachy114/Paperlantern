<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ProfileBorder extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'image_path',
        'is_default',
        'is_public',
        'is_free',
        'credit_cost',
        'subscription_free',
        'published_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_public' => 'boolean',
            'is_free' => 'boolean',
            'credit_cost' => 'integer',
            'subscription_free' => 'boolean',
            'published_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (ProfileBorder $border) {
            Storage::disk('public')->delete($border->image_path);
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
