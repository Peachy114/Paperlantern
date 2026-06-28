<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EarningSnapshot extends Model
{
    protected $fillable = [
        'storyteller_id',
        'work_title',
        'chapter_title',
        'chapter_id',
        'credits_spent',
        'platform_cut',
        'storyteller_cut',
        'platform_php',
        'storyteller_php',
        'credit_to_php_rate',
        'earned_at',
    ];

    protected $casts = [
        'earned_at' => 'datetime',
    ];
}