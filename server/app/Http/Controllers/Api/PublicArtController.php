<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Art;
use App\Models\FeatureBoost;
use App\Services\ContentSuspensionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicArtController extends Controller
{
    public function __construct(private ContentSuspensionService $contentSuspensions) {}

    public function index(Request $request): JsonResponse
    {
        $query = Art::query()
            ->select('arts.*')
            ->where('status', 'published')
            ->whereDoesntHave('activeContentSuspensions', fn($q) => $q->whereNull('target_field'))
            ->with([
                'activeContentSuspensions',
                'images' => fn($q) => $q->whereDoesntHave('activeContentSuspensions', fn($inner) => $inner->whereNull('target_field')),
                'images.activeContentSuspensions',
                'user:id,name,username,role,avatar',
            ])
            ->selectSub($this->activeBoostSubquery('art'), 'boosted_until');

        if ($request->filled('label')) {
            $query->whereJsonContains('labels', $request->query('label'));
        }

        if ($request->filled('q')) {
            $search = $request->query('q');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('labels', 'like', "%{$search}%");
            });
        }

        $arts = $query
            ->orderByRaw('CASE WHEN boosted_until IS NULL THEN 1 ELSE 0 END ASC')
            ->orderByDesc('boosted_until')
            ->orderByRaw('CASE WHEN public_sort_order IS NULL THEN 1 ELSE 0 END ASC')
            ->orderBy('public_sort_order')
            ->orderByDesc('views')
            ->latest()
            ->paginate(30);

        $arts->getCollection()->transform(fn(Art $art) => $this->contentSuspensions->maskArt($art));

        return response()->json([
            'featured_artists' => $this->featuredArtists(),
            'tags' => $this->tags($request)->getData(true),
            'arts' => $arts,
        ]);
    }

    public function tags(Request $request): JsonResponse
    {
        $search = strtolower((string) $request->query('q', ''));
        $tags = [];

        Art::where('status', 'published')
            ->whereDoesntHave('activeContentSuspensions', fn($q) => $q->whereNull('target_field'))
            ->whereNotNull('labels')
            ->get(['user_id', 'labels'])
            ->each(function (Art $art) use (&$tags, $search) {
                foreach ($art->labels ?? [] as $label) {
                    $label = trim((string) $label);
                    if ($label === '') {
                        continue;
                    }

                    if ($search !== '' && ! str_contains(strtolower($label), $search)) {
                        continue;
                    }

                    $key = strtolower($label);
                    $tags[$key] ??= ['label' => $label, 'artists' => []];
                    $tags[$key]['artists'][$art->user_id] = true;
                }
            });

        $result = collect($tags)
            ->map(fn($tag) => [
                'label' => $tag['label'],
                'artists_count' => count($tag['artists']),
            ])
            ->sortByDesc('artists_count')
            ->values()
            ->take(20);

        return response()->json($result);
    }

    private function featuredArtists(): array
    {
        return FeatureBoost::query()
            ->where('target_type', 'artist_profile')
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now())
            ->with('user:id,name,username,avatar,artist_title,role')
            ->orderByDesc('ends_at')
            ->limit(12)
            ->get()
            ->filter(fn(FeatureBoost $boost) => $boost->user?->role === 'storyteller')
            ->map(fn(FeatureBoost $boost) => [
                'id' => $boost->user->id,
                'name' => $boost->user->name,
                'username' => $boost->user->username,
                'avatar' => $boost->user->avatar,
                'artist_title' => $boost->user->artist_title,
                'boosted_until' => $boost->ends_at,
            ])
            ->values()
            ->all();
    }

    private function activeBoostSubquery(string $targetType)
    {
        return FeatureBoost::query()
            ->selectRaw('MAX(ends_at)')
            ->whereColumn('target_id', 'arts.id')
            ->where('target_type', $targetType)
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now());
    }
}
