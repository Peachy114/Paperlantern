<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\CreditPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CreditPackageController extends Controller
{
    public function index(): JsonResponse
    {
        $packages = CreditPackage::query()
            ->orderBy('sort_order')
            ->orderBy('credits')
            ->get()
            ->map(fn(CreditPackage $package) => $this->payload($package));

        return response()->json(['data' => $packages]);
    }

    public function store(Request $request): JsonResponse
    {
        $package = CreditPackage::create($this->validated($request));

        return response()->json(['data' => $this->payload($package)], 201);
    }

    public function update(Request $request, CreditPackage $creditPackage): JsonResponse
    {
        $creditPackage->update($this->validated($request));

        return response()->json(['data' => $this->payload($creditPackage->fresh())]);
    }

    public function destroy(CreditPackage $creditPackage): JsonResponse
    {
        $creditPackage->delete();

        return response()->json(['message' => 'Credit package deleted.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'credits' => ['required', 'integer', 'min:1', 'max:1000000'],
            'price' => ['required', 'numeric', 'min:1', 'max:999999.99'],
            'promo_label' => ['nullable', 'string', 'max:80'],
            'promo_start_at' => ['nullable', 'date'],
            'promo_end_at' => ['nullable', 'date', Rule::when(
                $request->filled('promo_start_at'),
                ['after_or_equal:promo_start_at'],
            )],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999999'],
        ]);
    }

    private function payload(CreditPackage $package): array
    {
        return [
            'id' => $package->id,
            'name' => $package->name,
            'credits' => $package->credits,
            'price' => (float) $package->price,
            'promo_label' => $package->promo_label,
            'promo_start_at' => $package->promo_start_at?->toIso8601String(),
            'promo_end_at' => $package->promo_end_at?->toIso8601String(),
            'is_active' => $package->is_active,
            'is_visible' => $package->isAvailableForPurchase(),
            'sort_order' => $package->sort_order,
            'created_at' => $package->created_at?->toIso8601String(),
            'updated_at' => $package->updated_at?->toIso8601String(),
        ];
    }
}
