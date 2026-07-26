<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class CommissionService extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'commission_category_id',
        'title',
        'slug',
        'description',
        'image_path',
        'base_price_credits',
        'min_price_credits',
        'delivery_days',
        'slots_available',
        'status',
        'flow',
        'terms',
        'quote_rules',
        'refund_policy',
        'required_references',
        'request_questions',
        'info_questions',
        'client_fields',
        'promo_discounts',
        'setup_options',
        'sort_order',
        'is_published',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'base_price_credits' => 'integer',
            'min_price_credits' => 'integer',
            'delivery_days' => 'integer',
            'slots_available' => 'integer',
            'flow' => 'array',
            'request_questions' => 'array',
            'info_questions' => 'array',
            'client_fields' => 'array',
            'promo_discounts' => 'array',
            'setup_options' => 'array',
            'sort_order' => 'integer',
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CommissionCategory::class, 'commission_category_id');
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(CommissionRating::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(CommissionOrder::class);
    }

    public static function generateSlug(string $title, ?string $excludeId = null): string
    {
        $base = Str::slug($title);
        $base = $base !== '' ? $base : 'commission';
        $slug = $base;
        $count = 2;

        while (
            static::where('slug', $slug)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $slug = "{$base}-{$count}";
            $count++;
        }

        return $slug;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
