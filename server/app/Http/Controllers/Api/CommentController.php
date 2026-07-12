<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(private CommentService $comments) {}

    public function index(Request $request, string $type, string $id): JsonResponse
    {
        $sort = $request->query('sort', 'all');

        abort_unless(in_array($sort, ['all', 'latest', 'popular'], true), 422, 'Unsupported comment sort.');

        return response()->json($this->comments->list($type, $id, $sort));
    }

    public function store(Request $request, string $type, string $id): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:2000'],
            'artist_sticker_id' => ['nullable', 'string', 'exists:artist_stickers,id'],
            'parent_id' => ['nullable', 'string', 'exists:comments,id'],
            'reaction_emoji' => ['nullable', 'string', 'max:16'],
            'gif_url' => ['nullable', 'url', 'max:2048'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'image' => ['nullable', 'image', 'max:10240'],
            'is_spoiler' => ['nullable', 'boolean'],
        ]);

        return response()->json(
            $this->comments->create($request->user(), $type, $id, $validated, $request),
            201,
        );
    }

    public function toggleLike(Request $request, Comment $comment): JsonResponse
    {
        abort_unless($comment->status === 'visible', 404);

        return response()->json($this->comments->toggleLike($request->user(), $comment));
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        abort_unless($comment->status === 'visible', 404);

        return response()->json($this->comments->remove($request->user(), $comment));
    }

    public function pin(Request $request, string $comment): JsonResponse
    {
        $validated = $request->validate([
            'is_pinned' => ['required', 'boolean'],
        ]);

        $commentModel = Comment::where('status', 'visible')->findOrFail($comment);

        return response()->json(
            $this->comments->pin($request->user(), $commentModel, (bool) $validated['is_pinned'])
        );
    }
}
