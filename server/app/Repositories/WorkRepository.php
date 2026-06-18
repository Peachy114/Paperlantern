<?php

namespace App\Repositories;

use App\Models\Work;
use Illuminate\Http\Request;

class WorkRepository
{
    public function getByUser($user): \Illuminate\Database\Eloquent\Collection
    {
        return $user->works()
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
}