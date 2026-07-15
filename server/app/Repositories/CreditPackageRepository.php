<?php

namespace App\Repositories;

use App\Models\CreditPackage;
use Illuminate\Database\Eloquent\Collection;

class CreditPackageRepository
{
    public function allActive(): Collection
    {
        return CreditPackage::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('promo_start_at')
                    ->orWhere('promo_start_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('promo_end_at')
                    ->orWhere('promo_end_at', '>=', now());
            })
            ->orderBy('sort_order')
            ->orderBy('credits')
            ->get();
    }

    public function find(int $id): ?CreditPackage
    {
        return CreditPackage::find($id);
    }
}
