<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WorkFavorite extends Model
{
    use HasUuids;

    protected $fillable = ['work_id', 'user_id'];

    public function work()
    {
        return $this->belongsTo(Work::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
