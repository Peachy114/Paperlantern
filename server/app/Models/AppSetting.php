<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    public static function valueFor(string $key, array $default = []): array
    {
        return static::query()->where('key', $key)->first()?->value ?? $default;
    }

    public static function putValue(string $key, array $value): self
    {
        return static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
