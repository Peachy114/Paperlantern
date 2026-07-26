<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class FeedPostAttachment extends Model
{
    use HasUuids;

    protected $fillable = [
        'feed_post_id',
        'attachable_type',
        'attachable_id',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    public function feedPost()
    {
        return $this->belongsTo(FeedPost::class);
    }
}
