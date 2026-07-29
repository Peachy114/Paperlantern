<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'reader_categories',
        'creator_categories',
        'in_app_enabled',
        'email_enabled',
        'push_enabled',
        'digest_enabled',
        'digest_frequency',
        'quiet_hours_start',
        'quiet_hours_end',
        'per_work_controls',
    ];

    protected function casts(): array
    {
        return [
            'reader_categories' => 'array',
            'creator_categories' => 'array',
            'in_app_enabled' => 'boolean',
            'email_enabled' => 'boolean',
            'push_enabled' => 'boolean',
            'digest_enabled' => 'boolean',
            'per_work_controls' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
