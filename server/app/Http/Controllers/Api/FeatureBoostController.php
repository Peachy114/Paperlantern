<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FeatureBoostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeatureBoostController extends Controller
{
    public function __construct(private FeatureBoostService $service) {}

    public function prices(): JsonResponse
    {
        return response()->json($this->service->prices());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => ['required', 'in:artist_profile,art,work'],
            'target_id' => ['nullable', 'string'],
            'days' => ['required', 'integer', 'min:1', 'max:30'],
        ]);

        return response()->json($this->service->purchase($request->user(), $validated), 201);
    }
}
