<?php

namespace App\Services;

use App\Models\Art;
use App\Http\Controllers\Api\Studio\CommissionController;
use App\Models\User;
use App\Repositories\ArtRepository;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ArtService
{
    public function __construct(
        private ArtRepository $repo,
        private ArtWatermarkService $watermarks,
    ) {}

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
            'commission_profile' => CommissionController::formatProfile($user->commissionArtistProfile),
            'arts' => $arts,
        ];
    }

    public function createArt(User $user, array $validated, Request $request): Art
    {
        $files = $this->uploadedArtFiles($request);
        $imageDescriptions = $validated['image_descriptions'] ?? [];
        $validated['labels'] = $this->normalizeLabels($validated['labels'] ?? []);
        $validated['download_policy'] = $validated['download_policy'] ?? 'disabled';
        $validated['download_credits'] = $this->normalizeDownloadCredits(
            $validated['download_policy'],
            $validated['download_credits'] ?? 0,
        );
        $validated['apply_watermark'] = array_key_exists('apply_watermark', $validated)
            ? (bool) $validated['apply_watermark']
            : true;

        return DB::transaction(function () use ($user, $validated, $files, $imageDescriptions, $request) {
            $validated['slug'] = Art::generateSlug($validated['title'], $user->id);
            $firstUpload = $this->storeArtFile($files[0], $user, (bool) $validated['apply_watermark']);
            $validated['image_path'] = $firstUpload['display'];
            $validated['original_image_path'] = $firstUpload['original'];
            unset($validated['image'], $validated['images'], $validated['image_descriptions'], $validated['download_files']);

            $art = $this->repo->create($user, $validated);

            $art->images()->create([
                'image_path' => $art->image_path,
                'original_image_path' => $firstUpload['original'],
                'description' => $imageDescriptions[0] ?? null,
                'sort_order' => 0,
            ]);

            foreach (array_slice($files, 1) as $index => $file) {
                $upload = $this->storeArtFile($file, $user, (bool) $validated['apply_watermark']);
                $art->images()->create([
                    'image_path' => $upload['display'],
                    'original_image_path' => $upload['original'],
                    'description' => $imageDescriptions[$index + 1] ?? null,
                    'sort_order' => $index + 1,
                ]);
            }

            $this->replaceDownloadFiles($art, $this->uploadedDownloadFiles($request));

            return $art->load(['images', 'downloadFiles']);
        });
    }

    public function updateArt(Art $art, array $validated, Request $request): Art
    {
        if (array_key_exists('labels', $validated)) {
            $validated['labels'] = $this->normalizeLabels($validated['labels'] ?? []);
        }
        if (array_key_exists('download_policy', $validated) || array_key_exists('download_credits', $validated)) {
            $validated['download_policy'] = $validated['download_policy'] ?? $art->download_policy ?? 'disabled';
            $validated['download_credits'] = $this->normalizeDownloadCredits(
                $validated['download_policy'],
                $validated['download_credits'] ?? $art->download_credits ?? 0,
            );
        }
        if (array_key_exists('apply_watermark', $validated)) {
            $validated['apply_watermark'] = (bool) $validated['apply_watermark'];
        }

        return DB::transaction(function () use ($art, $validated, $request) {
            if (isset($validated['title'])) {
                $validated['slug'] = Art::generateSlug($validated['title'], $art->user_id, $art->id);
            }

            $files = $this->uploadedArtFiles($request);
            $applyWatermark = array_key_exists('apply_watermark', $validated)
                ? (bool) $validated['apply_watermark']
                : (bool) $art->apply_watermark;

            if ($files !== []) {
                $imageDescriptions = $validated['image_descriptions'] ?? [];
                $this->deleteArtFiles($art);
                $art->images()->delete();

                $firstUpload = $this->storeArtFile($files[0], $art->user, $applyWatermark);
                $validated['image_path'] = $firstUpload['display'];
                $validated['original_image_path'] = $firstUpload['original'];

                $art->images()->create([
                    'image_path' => $validated['image_path'],
                    'original_image_path' => $firstUpload['original'],
                    'description' => $imageDescriptions[0] ?? null,
                    'sort_order' => 0,
                ]);

                foreach (array_slice($files, 1) as $index => $file) {
                    $upload = $this->storeArtFile($file, $art->user, $applyWatermark);
                    $art->images()->create([
                        'image_path' => $upload['display'],
                        'original_image_path' => $upload['original'],
                        'description' => $imageDescriptions[$index + 1] ?? null,
                        'sort_order' => $index + 1,
                    ]);
                }
            } elseif (array_key_exists('apply_watermark', $validated)) {
                $this->regenerateDisplayFiles($art, $applyWatermark);
            }

            if ($request->hasFile('download_files')) {
                $this->replaceDownloadFiles($art, $this->uploadedDownloadFiles($request));
            }

            unset($validated['image'], $validated['images'], $validated['image_descriptions'], $validated['download_files']);

            return $this->repo->update($art, $validated)->load(['images', 'downloadFiles']);
        });
    }

    public function getOwnedArt(User $user, string $slug, bool $withTrashed = false): Art
    {
        return Art::query()
            ->when($withTrashed, fn($query) => $query->withTrashed())
            ->with('images')
            ->with('downloadFiles')
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

    private function storeArtFile(UploadedFile $file, User $user, bool $applyWatermark): array
    {
        $originalPath = $file->store("arts/originals/{$user->id}", 'local');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        $filename = pathinfo($originalPath, PATHINFO_FILENAME) . '.' . $extension;
        $displayPath = "arts/{$user->id}/{$filename}";

        $this->watermarks->createDisplayCopy(
            Storage::disk('local')->path($originalPath),
            $displayPath,
            $applyWatermark,
        );

        return [
            'display' => $displayPath,
            'original' => $originalPath,
        ];
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

    private function uploadedDownloadFiles(Request $request): array
    {
        if (! $request->hasFile('download_files')) {
            return [];
        }

        return array_values($request->file('download_files'));
    }

    private function replaceDownloadFiles(Art $art, array $files): void
    {
        $this->deleteDownloadFiles($art);
        $art->downloadFiles()->delete();

        foreach ($files as $index => $file) {
            $path = $file->store("arts/downloads/{$art->user_id}/{$art->id}", 'local');
            $art->downloadFiles()->create([
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size_bytes' => $file->getSize() ?: 0,
                'sort_order' => $index,
            ]);
        }
    }

    private function deleteArtFiles(Art $art): void
    {
        $publicPaths = $art->images->pluck('image_path')->push($art->image_path)->filter()->unique();
        $originalPaths = $art->images
            ->pluck('original_image_path')
            ->push($art->original_image_path)
            ->filter()
            ->unique();

        Storage::disk('public')->delete($publicPaths->all());
        Storage::disk('local')->delete($originalPaths->all());
        $this->deleteDownloadFiles($art);
    }

    private function deleteDownloadFiles(Art $art): void
    {
        $paths = $art->downloadFiles->pluck('file_path')->filter()->unique()->all();
        Storage::disk('local')->delete($paths);
    }

    private function regenerateDisplayFiles(Art $art, bool $applyWatermark): void
    {
        $items = $art->images->isNotEmpty()
            ? $art->images
            : collect([(object) [
                'original_image_path' => $art->original_image_path,
                'image_path' => $art->image_path,
            ]]);

        foreach ($items as $item) {
            if (! $item->original_image_path || ! $item->image_path) {
                continue;
            }

            if (! Storage::disk('local')->exists($item->original_image_path)) {
                continue;
            }

            $this->watermarks->createDisplayCopy(
                Storage::disk('local')->path($item->original_image_path),
                $item->image_path,
                $applyWatermark,
            );
        }
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

    private function normalizeDownloadCredits(string $policy, mixed $credits): int
    {
        if ($policy !== 'paid') {
            return 0;
        }

        return max(1, min(999, (int) $credits));
    }
}
