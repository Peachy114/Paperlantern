<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use App\Models\StickyNote;
use App\Services\StickyNoteService;
use Illuminate\Http\Request;

class StickyNoteController extends Controller
{
    public function __construct(private StickyNoteService $service) {}

    public function index(Request $request)
    {
        \Log::info('sticky notes for user', ['user_id' => $request->user()->id]);
        return response()->json($this->service->getUserNotes($request->user()));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'      => 'required|in:text,image',
            'text'      => 'required_if:type,text|nullable|string|max:80',
            'color'     => 'nullable|string|max:20',
            'image'     => 'required_if:type,image|nullable|image|max:2048',
            'imageMode' => 'nullable|in:photo,sticker',
            'rotate'    => 'nullable|string|max:10',
            'x'         => 'nullable|numeric',
            'y'         => 'nullable|numeric',
        ]);

        $note = $this->service->createNote($request->user(), $validated, $request);

        return response()->json($note, 201);
    }

    public function updatePosition(Request $request, StickyNote $note)
    {
        abort_if($note->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'x' => 'required|numeric',
            'y' => 'required|numeric',
        ]);

        $this->service->updatePosition($note, $validated);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, StickyNote $note)
    {
        abort_if($note->user_id !== $request->user()->id, 403);

        $this->service->deleteNote($note);

        return response()->json(['ok' => true]);
    }
}