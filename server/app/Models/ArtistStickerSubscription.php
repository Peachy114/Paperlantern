<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArtistStickerSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'artist_sticker_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sticker()
    {
        return $this->belongsTo(ArtistSticker::class, 'artist_sticker_id');
    }
}
