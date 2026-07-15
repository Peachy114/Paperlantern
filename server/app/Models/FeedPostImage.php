<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FeedPostImage extends Model
{
    use HasUuids;

    protected $fillable = [
        'feed_post_id',
        'image_path',
        'moderation_status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function feedPost()
    {
        return $this->belongsTo(FeedPost::class);
    }
}
