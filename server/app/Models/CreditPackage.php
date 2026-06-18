<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditPackage extends Model
{
    protected $fillable = [
        'name',
        'credits',
        'price',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'credits'   => 'integer',
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
    ];
}