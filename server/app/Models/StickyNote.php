<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StickyNote extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'work_id',
        'type', 
        'text', 
        'color',
        'image_path',
        'image_mode',
        'rotate', 
        'x', 'y',
        'moderation_status',
    ];

    protected $casts = [
        'x' => 'float',
        'y' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
