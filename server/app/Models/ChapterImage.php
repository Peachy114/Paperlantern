<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChapterImage extends Model
{
    protected $fillable = ['chapter_id', 'path', 'order'];

    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }
}
