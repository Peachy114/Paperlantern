<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\PageLayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageLayoutController extends Controller
{
    public function __construct(private PageLayoutService $layouts) {}

    public function show(string $page): JsonResponse
    {
        return response()->json($this->layouts->get($page));
    }

    public function update(Request $request, string $page): JsonResponse
    {
        $validated = $request->validate([
            'widgets' => ['required', 'array', 'max:80'],
        ]);

        return response()->json($this->layouts->save($page, $validated['widgets'], $request->user()->id));
    }

    public function reset(string $page): JsonResponse
    {
        return response()->json($this->layouts->reset($page));
    }

    public function uploadAsset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
        ]);

        return response()->json([
            'path' => $validated['asset']->store('page-builder-assets', 'public'),
        ], 201);
    }
}
