<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuperLikeAward extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'icon',
        'credit_cost',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'credit_cost' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function superLikes(): HasMany
    {
        return $this->hasMany(SuperLike::class);
    }
}
