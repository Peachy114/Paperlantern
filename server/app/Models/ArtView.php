<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArtView extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'art_id',
        'user_id',
        'viewer_key',
        'viewed_on',
    ];

    protected function casts(): array
    {
        return [
            'viewed_on' => 'date',
        ];
    }

    public function art()
    {
        return $this->belongsTo(Art::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
