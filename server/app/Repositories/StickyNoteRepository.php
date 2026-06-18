<?php

namespace App\Repositories;

use App\Models\StickyNote;
use Illuminate\Support\Facades\Storage;

class StickyNoteRepository
{
    public function getByUser($user): \Illuminate\Database\Eloquent\Collection
    {
        return $user->stickyNotes()
            ->orderBy('created_at')
            ->get();
    }

    public function create($user, array $data): StickyNote
    {
        return $user->stickyNotes()->create($data);
    }

    public function updatePosition(StickyNote $note, array $data): void
    {
        $note->update($data);
    }

    public function delete(StickyNote $note): void
    {
        if ($note->image_path) {
            Storage::disk('public')->delete($note->image_path);
        }

        $note->delete();
    }
}