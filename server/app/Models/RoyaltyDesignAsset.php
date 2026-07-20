<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoyaltyDesignAsset extends Model
{
    use HasFactory, HasUuids;

    public const TYPES = [
        'message_design',
        'message_background',
        'comment_border',
        'board_button',
    ];

    protected $fillable = [
        'user_id',
        'type',
        'name',
        'description',
        'image_path',
        'style_settings',
        'is_active',
        'is_public',
        'subscription_free',
        'published_at',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'subscription_free' => 'boolean',
        'published_at' => 'datetime',
        'style_settings' => 'array',
        'sort_order' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
