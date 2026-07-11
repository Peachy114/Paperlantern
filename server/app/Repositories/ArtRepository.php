<?php

namespace App\Repositories;

use App\Models\Art;
use App\Models\FeatureBoost;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class ArtRepository
{
    public function getByUser(User $user): Collection
    {
        return $user->arts()
            ->select('arts.*')
            ->selectSub($this->activeArtBoostSubquery(), 'boosted_until')
            ->with('images')
            ->latest()
            ->get();
    }

    public function getTrashedByUser(User $user): Collection
    {
        return Art::onlyTrashed()
            ->where('user_id', $user->id)
            ->with('images')
            ->orderByDesc('deleted_at')
            ->get();
    }

    public function create(User $user, array $data): Art
    {
        return $user->arts()->create($data);
    }

    public function update(Art $art, array $data): Art
    {
        $art->update($data);

        return $art->fresh();
    }

    private function activeArtBoostSubquery()
    {
        return FeatureBoost::query()
            ->selectRaw('MAX(ends_at)')
            ->whereColumn('target_id', 'arts.id')
            ->where('target_type', 'art')
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now());
    }
}
