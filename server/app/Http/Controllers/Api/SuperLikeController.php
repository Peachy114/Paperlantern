<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SuperLikeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperLikeController extends Controller
{
    public function __construct(private SuperLikeService $superLikes) {}

    public function store(Request $request, string $type, string $id): JsonResponse
    {
        return response()->json($this->superLikes->send($request->user(), $type, $id));
    }
}
