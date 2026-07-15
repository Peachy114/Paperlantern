<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ArtDownload extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'art_id',
        'credit_cost',
    ];

    protected function casts(): array
    {
        return [
            'credit_cost' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function art()
    {
        return $this->belongsTo(Art::class);
    }
}
