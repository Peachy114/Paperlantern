<?php

namespace App\Repositories;

use App\Models\CreditPackage;
use Illuminate\Database\Eloquent\Collection;

class CreditPackageRepository
{
    public function allActive(): Collection
    {
        return CreditPackage::where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }

    public function find(int $id): ?CreditPackage
    {
        return CreditPackage::find($id);
    }
}