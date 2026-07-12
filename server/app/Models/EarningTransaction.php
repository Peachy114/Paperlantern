<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EarningTransaction extends Model
{
    use HasUuids;

    protected $fillable = [
        'storyteller_id',
        'reader_id',
        'source',
        'chapter_id',
        'earnable_type',
        'earnable_id',
        'credits_spent',
        'platform_cut',
        'storyteller_cut',
        'platform_php',
        'storyteller_php',
        'credit_to_php_rate',
    ];

    protected $casts = [
        'credits_spent'      => 'decimal:2',
        'platform_cut'       => 'decimal:2',
        'storyteller_cut'    => 'decimal:2',
        'platform_php'       => 'decimal:2',
        'storyteller_php'    => 'decimal:2',
        'credit_to_php_rate' => 'decimal:4',
    ];

    public function storyteller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'storyteller_id');
    }

    public function reader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reader_id');
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }
}
