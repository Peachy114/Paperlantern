<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes, HasUuids;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'avatar',
        'profile_cover',
        'bio',
        'artist_title',
        'profile_cover_position_x',
        'profile_cover_position_y',
        'avatar_position_x',
        'avatar_position_y',
        'show_public_links',
        'profile_background_color',
        'profile_background_gradient_from',
        'profile_background_gradient_to',
        'profile_background_gradient_direction',
        'profile_background_image',
        'profile_background_blur',
        'profile_banner_height',
        'profile_avatar_frame_x',
        'profile_avatar_frame_y',
        'profile_avatar_border_width',
        'profile_avatar_border_color',
        'profile_avatar_border_radius',
        'profile_nav_layout',
        'profile_nav_x',
        'profile_nav_y',
        'profile_nav_w',
        'profile_nav_h',
        'profile_board_min_height',
        'profile_arts_tile_width',
        'profile_sticker_size',
        'profile_show_cover',
        'profile_cover_width',
        'profile_background_has_gradient',
        'profile_tabs_config',
        'profile_links',
        'profile_border_id',
        'credits',
        'strike_count',
        'is_banned',
        'is_suspended',
        'suspension_reason',
        'suspended_at',
        'ban_reason',
        'banned_at',
        'dark_mode',
        'twitter_url',
        'instagram_url',
        'tiktok_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'banned_at'         => 'datetime',
            'suspended_at'      => 'datetime',
            'password'          => 'hashed',
            'is_banned'         => 'boolean',
            'is_suspended'      => 'boolean',
            'credits'           => 'integer',
            'dark_mode'         => 'boolean',
            'profile_cover_position_x' => 'float',
            'profile_cover_position_y' => 'float',
            'avatar_position_x' => 'float',
            'avatar_position_y' => 'float',
            'show_public_links' => 'boolean',
            'profile_background_blur' => 'integer',
            'profile_banner_height' => 'integer',
            'profile_avatar_frame_x' => 'float',
            'profile_avatar_frame_y' => 'float',
            'profile_avatar_border_width' => 'integer',
            'profile_avatar_border_radius' => 'integer',
            'profile_nav_x' => 'float',
            'profile_nav_y' => 'float',
            'profile_nav_w' => 'float',
            'profile_nav_h' => 'integer',
            'profile_board_min_height' => 'integer',
            'profile_arts_tile_width' => 'integer',
            'profile_sticker_size' => 'integer',
            'profile_show_cover' => 'boolean',
            'profile_cover_width' => 'integer',
            'profile_background_has_gradient' => 'boolean',
            'profile_tabs_config' => 'array',
            'profile_links' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            $user->works()->each(function ($work) {
                if ($work->cover) Storage::delete($work->cover);
                if ($work->banner) Storage::delete($work->banner);

                $work->chapters()->each(function ($chapter) {
                    if ($chapter->cover) Storage::delete($chapter->cover);
                    $chapter->images()->each(function ($image) {
                        Storage::delete($image->path);
                    });
                });

                $work->delete();
            });

            $user->stickyNotes()->each(function ($note) {
                if ($note->type === 'image' && $note->image_path) {
                    Storage::delete($note->image_path);
                }
                $note->delete();
            });

            if ($user->avatar) Storage::disk('public')->delete($user->avatar);
            if ($user->profile_cover) Storage::disk('public')->delete($user->profile_cover);
            if ($user->profile_background_image) Storage::disk('public')->delete($user->profile_background_image);
        });
    }

    public function works()
    {
        return $this->hasMany(Work::class);
    }

    public function arts()
    {
        return $this->hasMany(Art::class);
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function artistProfileBlocks()
    {
        return $this->hasMany(ArtistProfileBlock::class)->orderBy('sort_order');
    }

    public function artistStickers()
    {
        return $this->hasMany(ArtistSticker::class)->orderBy('sort_order');
    }

    public function profileBorders()
    {
        return $this->hasMany(ProfileBorder::class)->orderBy('sort_order');
    }

    public function selectedProfileBorder()
    {
        return $this->belongsTo(ProfileBorder::class, 'profile_border_id');
    }

    public function subscribedArtistStickers()
    {
        return $this->belongsToMany(ArtistSticker::class, 'artist_sticker_subscriptions')
            ->withTimestamps();
    }

    public function purchasedArtistStickers()
    {
        return $this->belongsToMany(ArtistSticker::class, 'artist_sticker_purchases')
            ->withPivot('credits_spent')
            ->withTimestamps();
    }

    public function stickyNotes()
    {
        return $this->hasMany(StickyNote::class);
    }

    public function violations()
    {
        return $this->hasMany(Violation::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function isAtRisk(): bool
    {
        return $this->strike_count >= 2 && ! $this->is_banned && ! $this->is_suspended;
    }
}
