<?php

namespace App\Services;

use App\Models\Work;
use App\Repositories\WorkRepository;
use Illuminate\Http\Request;

class WorkService
{
    public function __construct(private WorkRepository $repo) {}

    public function getUserWorks($user): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getByUser($user);
    }

    public function createWork($user, array $validated, Request $request): Work
    {
        if ($request->hasFile('cover')) {
            $validated['cover'] = $request->file('cover')->store('covers', 'public');
        }

        if ($request->hasFile('banner')) {
            $validated['banner'] = $request->file('banner')->store('banners', 'public');
        }

        return $this->repo->create($user, $validated);
    }

    public function updateWork(Work $work, array $validated, Request $request): Work
    {
        if ($request->hasFile('cover')) {
            $validated['cover'] = $request->file('cover')->store('covers', 'public');
        } else {
            unset($validated['cover']);
        }

        if ($request->hasFile('banner')) {
            $validated['banner'] = $request->file('banner')->store('banners', 'public');
        } else {
            unset($validated['banner']);
        }

        return $this->repo->update($work, $validated);
    }

    public function deleteWork(Work $work): void
    {
        $this->repo->delete($work);
    }
}