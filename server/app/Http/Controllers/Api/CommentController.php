<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        ]);

        return response()->json(
            $this->comments->create($request->user(), $type, $id, $validated),
            201,
        );
    }
}
