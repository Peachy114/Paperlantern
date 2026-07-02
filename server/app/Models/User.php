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
        'bio',
        'credits',
        'strike_count',
        'is_banned',
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
            'password'          => 'hashed',
            'is_banned'         => 'boolean',
            'credits'           => 'integer',
            'dark_mode'         => 'boolean',
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

            if ($user->avatar) Storage::delete($user->avatar);
        });
    }

    public function works()
    {
        return $this->hasMany(Work::class);
    }

    public function stickyNotes()
    {
        return $this->hasMany(StickyNote::class);
    }

    public function violations()
    {
        return $this->hasMany(Violation::class);
    }
}