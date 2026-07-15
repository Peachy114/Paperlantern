<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionArtistProfile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'application_status',
        'commissions_enabled',
        'commission_status',
        'application_reason',
        'terms',
        'terms_moderation_status',
        'customers_count',
        'average_rating',
        'ratings_count',
    ];

    protected function casts(): array
    {
        return [
            'commissions_enabled' => 'boolean',
            'customers_count' => 'integer',
            'average_rating' => 'decimal:2',
            'ratings_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
