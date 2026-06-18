<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChapterView extends Model
{
    protected $fillable = ['chapter_id', 'user_id', 'ip_address'];
}
