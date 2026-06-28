<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ChapterImage extends Model
{
    use HasUuids;

    protected $fillable = ['chapter_id', 'path', 'order'];

    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }
}
