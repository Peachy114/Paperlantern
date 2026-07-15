<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageLayout extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'page_key',
        'widgets',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'widgets' => 'array',
        ];
    }
}
