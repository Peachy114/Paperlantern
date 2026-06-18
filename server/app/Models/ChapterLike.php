<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChapterLike extends Model
{
    protected $fillable = ['chapter_id', 'user_id'];
}
