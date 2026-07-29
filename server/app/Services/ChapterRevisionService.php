<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\ChapterRevision;
use App\Models\User;

class ChapterRevisionService
{
    public function snapshot(Chapter $chapter, ?User $user = null, string $source = 'manual'): ChapterRevision
    {
        // revision snapshot ----
        return ChapterRevision::create([
            'chapter_id' => $chapter->id,
            'user_id' => $user?->id,
            'source' => $source,
            'title' => $chapter->title,
            'content' => $chapter->content,
            'artist_note' => $chapter->artist_note,
            'word_count' => $this->wordCount($chapter->content),
        ]);
    }

    public function wordCount(?string $content): int
    {
        // html-aware word count ----
        $plain = trim(preg_replace('/\s+/', ' ', strip_tags((string) $content)));

        if ($plain === '') {
            return 0;
        }

        return str_word_count($plain);
    }
}
