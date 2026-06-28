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
        $validated['slug'] = Work::generateSlug($validated['title']);

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
        if (isset($validated['title'])) {
            $validated['slug'] = Work::generateSlug($validated['title'], $work->id);
        }
        
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
        // Snapshot all earning transactions for this work's chapters before deletion
        $work->loadMissing('chapters');

        $chapterIds = $work->chapters->pluck('id');

        if ($chapterIds->isNotEmpty()) {
            \App\Models\EarningTransaction::whereIn('chapter_id', $chapterIds)
                ->with('chapter:id,title')
                ->get()
                ->each(function ($tx) use ($work) {
                    \App\Models\EarningSnapshot::create([
                        'storyteller_id'    => $tx->storyteller_id,
                        'work_title'        => $work->title,
                        'chapter_title'     => $tx->chapter?->title ?? 'Deleted Chapter',
                        'chapter_id'        => $tx->chapter_id,
                        'credits_spent'     => $tx->credits_spent,
                        'platform_cut'      => $tx->platform_cut,
                        'storyteller_cut'   => $tx->storyteller_cut,
                        'platform_php'      => $tx->platform_php,
                        'storyteller_php'   => $tx->storyteller_php,
                        'credit_to_php_rate'=> $tx->credit_to_php_rate,
                        'earned_at'         => $tx->created_at,
                    ]);
                });
        }

        $this->repo->delete($work);
    }
}