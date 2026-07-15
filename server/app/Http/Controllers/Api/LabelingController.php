<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommissionCategory;
use App\Models\ContentLabel;
use App\Models\LabelRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class LabelingController extends Controller
{
    public function publicIndex(): JsonResponse
    {
        return response()->json([
            'genres' => $this->labels('genre', true),
            'labels' => $this->labels('label', true),
            'commission_types' => CommissionCategory::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'sort_order', 'is_active']),
        ]);
    }

    public function requestLabel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['genre', 'label'])],
            'name' => ['required', 'string', 'max:80'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $request = LabelRequest::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'name' => trim($validated['name']),
            'reason' => $validated['reason'] ?? null,
        ]);

        return response()->json([
            'message' => 'Your request was sent to admin for review.',
            'request' => $request,
        ], 201);
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json([
            'genres' => $this->labels('genre'),
            'labels' => $this->labels('label'),
            'commission_types' => CommissionCategory::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'sort_order', 'is_active']),
            'requests' => LabelRequest::query()
                ->with('user:id,name,username,email')
                ->latest()
                ->limit(100)
                ->get(),
        ]);
    }

    public function storeLabel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['genre', 'label'])],
            'name' => ['required', 'string', 'max:80'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $label = ContentLabel::create([
            'type' => $validated['type'],
            'name' => trim($validated['name']),
            'slug' => ContentLabel::makeSlug($validated['name']),
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['label' => $label], 201);
    }

    public function updateLabel(Request $request, ContentLabel $label): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:80'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['name'])) {
            $validated['name'] = trim($validated['name']);
            $validated['slug'] = ContentLabel::makeSlug($validated['name']);
        }

        $label->update($validated);

        return response()->json(['label' => $label->fresh()]);
    }

    public function updateRequest(Request $request, LabelRequest $labelRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
        ]);

        $labelRequest->update([
            'status' => $validated['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        if ($validated['status'] === 'approved') {
            ContentLabel::updateOrCreate(
                [
                    'type' => $labelRequest->type,
                    'slug' => Str::slug($labelRequest->name),
                ],
                [
                    'name' => $labelRequest->name,
                    'is_active' => true,
                ]
            );
        }

        return response()->json(['request' => $labelRequest->fresh('user')]);
    }

    private function labels(string $type, bool $activeOnly = false)
    {
        return ContentLabel::query()
            ->where('type', $type)
            ->when($activeOnly, fn ($query) => $query->where('is_active', true))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'type', 'name', 'slug', 'sort_order', 'is_active']);
    }
}
