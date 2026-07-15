<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserFollow extends Model
{
    use HasUuids;

    protected $fillable = [
        'follower_id',
        'followee_id',
    ];
}
