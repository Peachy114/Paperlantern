<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\HasContentSuspensions;

class ArtistProfileBlock extends Model
{
    use HasFactory, HasUuids, HasContentSuspensions;

    protected $fillable = [
        'user_id',
        'type',
        'text_content',
        'image_path',
        'image_url',
        'source_art_image_id',
        'source_sticker_id',
        'is_sticker',
        'width',
        'height',
        'x',
        'y',
        'w',
        'h',
        'padding_x',
        'padding_y',
        'fit_mode',
        'font_size',
        'z_index',
        'rotation',
        'background_color',
        'transparent_background',
        'overlay',
        'show_border',
        'border_color',
        'border_radius',
        'font_family',
        'font_color',
        'locked',
        'image_position_x',
        'image_position_y',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_sticker' => 'boolean',
            'x' => 'float',
            'y' => 'float',
            'w' => 'float',
            'h' => 'float',
            'padding_x' => 'integer',
            'padding_y' => 'integer',
            'font_size' => 'integer',
            'z_index' => 'integer',
            'rotation' => 'float',
            'transparent_background' => 'boolean',
            'overlay' => 'boolean',
            'show_border' => 'boolean',
            'border_radius' => 'integer',
            'locked' => 'boolean',
            'image_position_x' => 'integer',
            'image_position_y' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sourceArtImage()
    {
        return $this->belongsTo(ArtImage::class, 'source_art_image_id');
    }

    public function sourceSticker()
    {
        return $this->belongsTo(ArtistSticker::class, 'source_sticker_id');
    }
}
