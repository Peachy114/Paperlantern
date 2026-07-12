<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SuperLikeAward;
use App\Services\SuperLikeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperLikeController extends Controller
{
    public function __construct(private SuperLikeService $superLikes) {}

    public function awards(): JsonResponse
    {
        return response()->json([
            'data' => SuperLikeAward::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('credit_cost')
                ->get(),
        ]);
    }

    public function store(Request $request, string $type, string $id): JsonResponse
    {
        $validated = $request->validate([
            'award_id' => ['nullable', 'string', 'exists:super_like_awards,id'],
        ]);

        return response()->json(
            $this->superLikes->send($request->user(), $type, $id, $validated['award_id'] ?? null)
        );
    }
}
