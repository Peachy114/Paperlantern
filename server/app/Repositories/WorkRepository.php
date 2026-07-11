<?php

namespace App\Repositories;

use App\Models\Work;
use App\Models\FeatureBoost;
use Illuminate\Http\Request;

class WorkRepository
{
    public function getByUser($user): \Illuminate\Database\Eloquent\Collection
    {
        return $user->works()
            ->select('works.*')
            ->selectSub($this->activeWorkBoostSubquery(), 'boosted_until')
            ->withCount('chapters')
            ->latest()
            ->get();
    }

    public function create($user, array $data): Work
    {
        return $user->works()->create($data);
    }

    public function update(Work $work, array $data): Work
    {
        $work->update($data);
        return $work->fresh();
    }

    public function delete(Work $work): void
    {
        $work->delete();
    }

    private function activeWorkBoostSubquery()
    {
        return FeatureBoost::query()
            ->selectRaw('MAX(ends_at)')
            ->whereColumn('target_id', 'works.id')
            ->where('target_type', 'work')
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now());
    }
}
