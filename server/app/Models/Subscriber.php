<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscriber extends Model
{
    protected $fillable = ['email', 'agreed_at'];

    protected $casts = [
        'agreed_at' => 'datetime',
    ];
}