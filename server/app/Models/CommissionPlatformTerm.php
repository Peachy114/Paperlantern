<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommissionPlatformTerm extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'key',
        'terms',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'terms' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
