<?php

namespace App\Services;

use App\Models\Art;
use App\Models\User;
use App\Repositories\ArtRepository;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ArtService
{
    public function __construct(private ArtRepository $repo) {}

    public function getDashboard(User $user): array
    {
        $arts = $this->repo->getByUser($user);

        return [
            'stats' => [
                'arts' => $arts->count(),
                'views' => $arts->sum('views'),
                'likes' => $arts->sum('likes'),
                'comments' => $arts->sum('comments_count'),
                'super_likes' => $arts->sum('super_likes_count'),
                'super_like_credits' => $arts->sum('super_like_credits'),
            ],
            'arts' => $arts,
        ];
    }

    public function createArt(User $user, array $validated, Request $request): Art
    {
        $files = $this->uploadedArtFiles($request);
        $imageDescriptions = $validated['image_descriptions'] ?? [];
        $validated['labels'] = $this->normalizeLabels($validated['labels'] ?? []);

        return DB::transaction(function () use ($user, $validated, $files, $imageDescriptions) {
            $validated['slug'] = Art::generateSlug($validated['title'], $user->id);
            $validated['image_path'] = $this->storeArtFile($files[0], $user);
            unset($validated['image'], $validated['images'], $validated['image_descriptions']);

            $art = $this->repo->create($user, $validated);

            $art->images()->create([
                'image_path' => $art->image_path,
                'description' => $imageDescriptions[0] ?? null,
                'sort_order' => 0,
            ]);

            foreach (array_slice($files, 1) as $index => $file) {
                $art->images()->create([
                    'image_path' => $this->storeArtFile($file, $user),
                    'description' => $imageDescriptions[$index + 1] ?? null,
                    'sort_order' => $index + 1,
                ]);
            }

            return $art->load('images');
        });
    }

    public function updateArt(Art $art, array $validated, Request $request): Art
    {
        if (array_key_exists('labels', $validated)) {
            $validated['labels'] = $this->normalizeLabels($validated['labels'] ?? []);
        }

        return DB::transaction(function () use ($art, $validated, $request) {
            if (isset($validated['title'])) {
                $validated['slug'] = Art::generateSlug($validated['title'], $art->user_id, $art->id);
            }

            $files = $this->uploadedArtFiles($request);

            if ($files !== []) {
                $imageDescriptions = $validated['image_descriptions'] ?? [];
                $this->deleteArtFiles($art);
                $art->images()->delete();

                $validated['image_path'] = $this->storeArtFile($files[0], $art->user);

                $art->images()->create([
                    'image_path' => $validated['image_path'],
                    'description' => $imageDescriptions[0] ?? null,
                    'sort_order' => 0,
                ]);

                foreach (array_slice($files, 1) as $index => $file) {
                    $art->images()->create([
                        'image_path' => $this->storeArtFile($file, $art->user),
                        'description' => $imageDescriptions[$index + 1] ?? null,
                        'sort_order' => $index + 1,
                    ]);
                }
            }

            unset($validated['image'], $validated['images'], $validated['image_descriptions']);

            return $this->repo->update($art, $validated)->load('images');
        });
    }

    public function getOwnedArt(User $user, string $slug, bool $withTrashed = false): Art
    {
        return Art::query()
            ->when($withTrashed, fn($query) => $query->withTrashed())
            ->with('images')
            ->where('user_id', $user->id)
            ->where('slug', $slug)
            ->firstOrFail();
    }

    public function trashArt(Art $art): void
    {
        $art->delete();
    }

    public function restoreArt(User $user, string $slug): Art
    {
        $art = $this->getOwnedArt($user, $slug, true);
        $art->restore();

        return $art;
    }

    public function forceDeleteArt(User $user, string $slug): void
    {
        $art = $this->getOwnedArt($user, $slug, true);
        $this->deleteArtFiles($art);
        $art->forceDelete();
    }

    public function getTrashedArts(User $user)
    {
        return $this->repo->getTrashedByUser($user);
    }

    private function storeArtFile(UploadedFile $file, User $user): string
    {
        return $file->store("arts/{$user->id}", 'public');
    }

    private function uploadedArtFiles(Request $request): array
    {
        if ($request->hasFile('images')) {
            return array_values($request->file('images'));
        }

        if ($request->hasFile('image')) {
            return [$request->file('image')];
        }

        return [];
    }

    private function deleteArtFiles(Art $art): void
    {
        $paths = $art->images->pluck('image_path')->push($art->image_path)->filter()->unique();

        Storage::disk('public')->delete($paths->all());
    }

    private function normalizeLabels(array $labels): array
    {
        return collect($labels)
            ->map(fn($label) => trim((string) $label))
            ->filter()
            ->map(fn($label) => mb_strtolower($label))
            ->unique()
            ->take(12)
            ->values()
            ->all();
    }
}
