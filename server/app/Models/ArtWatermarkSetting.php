<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArtWatermarkSetting extends Model
{
    protected $fillable = [
        'noise_enabled',
        'noise_opacity',
        'noise_density',
    ];

    protected function casts(): array
    {
        return [
            'noise_enabled' => 'boolean',
            'noise_opacity' => 'integer',
            'noise_density' => 'integer',
        ];
    }

    public static function current(): self
    {
        return self::firstOrCreate(['id' => 1], [
            'noise_enabled' => false,
            'noise_opacity' => 8,
            'noise_density' => 2,
        ]);
    }
}
