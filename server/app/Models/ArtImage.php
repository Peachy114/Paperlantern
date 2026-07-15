<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasContentSuspensions;

class ArtImage extends Model
{
    use HasFactory, HasUuids, HasContentSuspensions;

    protected $fillable = [
        'art_id',
        'image_path',
        'original_image_path',
        'description',
        'sort_order',
    ];

    protected $hidden = [
        'original_image_path',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function art()
    {
        return $this->belongsTo(Art::class);
    }
}
