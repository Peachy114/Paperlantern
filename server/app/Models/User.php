<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;  
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
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
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'banned_at'         => 'datetime',
            'password'          => 'hashed',
            'is_banned'         => 'boolean',
            'credits'           => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            // Delete works and their storage files
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

            // Delete sticky note images
            $user->stickyNotes()->each(function ($note) {
                if ($note->type === 'image' && $note->image_path) {
                    Storage::delete($note->image_path);
                }
                $note->delete();
            });

            // Delete user avatar
            if ($user->avatar) Storage::delete($user->avatar);
        });
    }

    // relationship to work model
    public function works()
    {
        return $this->hasMany(Work::class);
    }

    //relationship to sticky notes
    public function stickyNotes()
    {
        return $this->hasMany(StickyNote::class);
    }

    public function violations()
    {
        return $this->hasMany(Violation::class);
    }
}
