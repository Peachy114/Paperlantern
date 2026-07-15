<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FeedPostLike extends Model
{
    use HasUuids;

    protected $fillable = [
        'feed_post_id',
        'user_id',
    ];
}
