<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ChapterView extends Model
{
    use HasUuids;

    protected $fillable = ['chapter_id', 'user_id', 'ip_address'];
}
