<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ArtWatermark extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'image_path',
        'target',
        'position',
        'offset_x',
        'offset_y',
        'width_percent',
        'opacity',
        'rotation',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'offset_x' => 'integer',
            'offset_y' => 'integer',
            'width_percent' => 'integer',
            'opacity' => 'integer',
            'rotation' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
