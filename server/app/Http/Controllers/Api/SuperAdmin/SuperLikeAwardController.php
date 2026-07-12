<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperLikeAward;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperLikeAwardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => SuperLikeAward::query()
                ->orderBy('sort_order')
                ->orderBy('credit_cost')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'icon' => ['nullable', 'string', 'max:32'],
            'credit_cost' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999'],
        ]);

        $award = SuperLikeAward::create([
            ...$validated,
            'icon' => ($validated['icon'] ?? null) ?: $this->iconFromName($validated['name']),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return response()->json($award, 201);
    }

    public function update(Request $request, SuperLikeAward $award): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'icon' => ['required', 'string', 'max:32'],
            'credit_cost' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999'],
        ]);

        $award->update($validated);

        return response()->json($award->fresh());
    }

    public function destroy(SuperLikeAward $award): JsonResponse
    {
        $award->update(['is_active' => false]);

        return response()->json(['message' => 'Award disabled.']);
    }

    private function iconFromName(string $name): string
    {
        $normalized = strtolower($name);

        return match (true) {
            str_contains($normalized, 'rocket') => 'rocket',
            str_contains($normalized, 'glass') => 'glasses',
            str_contains($normalized, 'star') => 'star',
            default => 'sparkles',
        };
    }
}
