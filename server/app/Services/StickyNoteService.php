<?php

namespace App\Services;

use App\Models\StickyNote;
use App\Repositories\StickyNoteRepository;
use Illuminate\Http\Request;

class StickyNoteService
{
    public function __construct(private StickyNoteRepository $repo) {}

    public function getUserNotes($user): \Illuminate\Support\Collection
    {
        return $this->repo->getByUser($user)
            ->map(fn($n) => $this->format($n));
    }

    public function createNote($user, array $validated, Request $request): array
    {
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('sticky-notes', 'public');
        }

        $note = $this->repo->create($user, [
            'type'       => $validated['type'],
            'text'       => $validated['text'] ?? null,
            'color'      => $validated['color'] ?? '#fef08a',
            'image_path' => $imagePath,
            'image_mode' => $validated['imageMode'] ?? 'photo',
            'rotate'     => $validated['rotate'] ?? '0deg',
            'x'          => $validated['x'] ?? 220,
            'y'          => $validated['y'] ?? 20,
        ]);

        return $this->format($note);
    }

    public function updatePosition(StickyNote $note, array $validated): void
    {
        $this->repo->updatePosition($note, $validated);
    }

    public function deleteNote(StickyNote $note): void
    {
        $this->repo->delete($note);
    }

    public function format(StickyNote $note): array
    {
        return [
            'id'        => $note->id,
            'type'      => $note->type,
            'text'      => $note->text,
            'color'     => $note->color,
            'imageUrl'  => $note->image_path
                ? asset('storage/' . $note->image_path)
                : null,
            'imageMode' => $note->image_mode,
            'rotate'    => $note->rotate,
            'x'         => $note->x,
            'y'         => $note->y,
        ];
    }
}