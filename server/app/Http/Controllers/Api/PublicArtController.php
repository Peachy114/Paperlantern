<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Art;
use App\Models\ArtImage;
use App\Models\ArtLike;
use App\Models\ArtView;
use App\Models\FeatureBoost;
use App\Services\ArtDownloadService;
use App\Services\ContentSuspensionService;
use App\Services\PageLayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PublicArtController extends Controller
{
    public function __construct(
        private ContentSuspensionService $contentSuspensions,
        private ArtDownloadService $downloads,
        private PageLayoutService $layouts,
    ) {}

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
                'user:id,name,username,role,avatar,artist_verified',
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

        $arts->getCollection()->transform(function (Art $art) {
            $art = $this->contentSuspensions->maskArt($art);
            $art->setAttribute('liked_by_me', auth('sanctum')->check()
                ? $art->likedByUsers()->where('user_id', auth('sanctum')->id())->exists()
                : false);
            $art->setAttribute('download_unlocked', $this->downloads->unlockedFor(auth('sanctum')->user(), $art));

            return $art;
        });

        return response()->json([
            'featured_artists' => $this->featuredArtists(),
            'tags' => $this->tags($request)->getData(true),
            'layout' => $this->layouts->get('arts'),
            'arts' => $arts,
        ]);
    }

    public function show(string $art): JsonResponse
    {
        $artModel = Art::query()
            ->where('status', 'published')
            ->whereDoesntHave('activeContentSuspensions', fn($q) => $q->whereNull('target_field'))
            ->with([
                'activeContentSuspensions',
                'images' => fn($q) => $q->whereDoesntHave('activeContentSuspensions', fn($inner) => $inner->whereNull('target_field')),
                'images.activeContentSuspensions',
                'user:id,name,username,role,avatar,artist_verified',
            ])
            ->where(fn($q) => $q->where('id', $art)->orWhere('slug', $art))
            ->firstOrFail();

        $artModel = $this->contentSuspensions->maskArt($artModel);
        $artModel->setAttribute('liked_by_me', auth('sanctum')->check()
            ? $artModel->likedByUsers()->where('user_id', auth('sanctum')->id())->exists()
            : false);
        $artModel->setAttribute('download_unlocked', $this->downloads->unlockedFor(auth('sanctum')->user(), $artModel));

        return response()->json($artModel);
    }

    public function purchaseDownload(Request $request, Art $art): JsonResponse
    {
        $this->abortUnlessDownloadable($art);

        if ($art->user_id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot buy or download your own art from the public page.',
                'unlocked' => false,
                'owner_blocked' => true,
            ], 403);
        }

        $result = $this->downloads->purchase($request->user(), $art->loadMissing('user'));
        $status = $result['success'] ? 200 : 402;

        return response()->json($result, $status);
    }

    public function recordView(Request $request, Art $art): JsonResponse
    {
        abort_unless($art->status === 'published', 404);
        abort_if($this->contentSuspensions->isHidden($art), 404, 'Art not found.');

        $user = auth('sanctum')->user();
        $guestId = null;
        if ($user) {
            $viewerIdentity = "user:{$user->id}";
        } else {
            $guestId = $request->cookie('latern_art_viewer') ?: (string) Str::uuid();
            $viewerIdentity = "guest:{$guestId}";
        }
        $viewedOn = now()->toDateString();
        $counted = false;

        DB::transaction(function () use ($art, $user, $viewerIdentity, $viewedOn, &$counted) {
            $view = ArtView::firstOrCreate(
                [
                    'art_id' => $art->id,
                    'viewer_key' => hash('sha256', $viewerIdentity),
                    'viewed_on' => $viewedOn,
                ],
                [
                    'user_id' => $user?->id,
                ]
            );

            if ($view->wasRecentlyCreated) {
                $art->increment('views');
                $counted = true;
            }
        });

        $response = response()->json([
            'views' => (int) $art->fresh()->views,
            'counted' => $counted,
        ]);

        if ($guestId) {
            $response->withCookie(cookie(
                'latern_art_viewer',
                $guestId,
                60 * 24 * 400,
                null,
                null,
                false,
                true,
                false,
                'Lax'
            ));
        }

        return $response;
    }

    public function download(Request $request, Art $art)
    {
        $this->abortUnlessDownloadable($art);

        if ($art->download_policy === 'disabled') {
            return response()->json(['message' => 'Downloads are disabled for this art.'], 403);
        }

        $user = auth('sanctum')->user();
        if ($user && $art->user_id === $user->id) {
            return response()->json([
                'message' => 'You cannot download your own art from the public page.',
                'owner_blocked' => true,
            ], 403);
        }

        if (! $this->downloads->unlockedFor($user, $art)) {
            return response()->json([
                'message' => $art->download_policy === 'paid'
                    ? 'Unlock this original art download with credits first.'
                    : 'Please sign in to download this art.',
                'requires_purchase' => $art->download_policy === 'paid',
                'credit_cost' => (int) $art->download_credits,
            ], $art->download_policy === 'paid' ? 402 : 401);
        }

        $image = $this->downloadImage($art, (string) $request->query('image_id', ''));
        $originalPath = $image?->original_image_path ?: $art->original_image_path;
        $displayPath = $image?->image_path ?: $art->image_path;
        $disk = $originalPath ? 'local' : 'public';
        $path = $originalPath ?: $displayPath;

        if (! $path || ! Storage::disk($disk)->exists($path)) {
            return response()->json(['message' => 'Original art file was not found.'], 404);
        }

        $art->increment('downloads_count');
        $extension = pathinfo($path, PATHINFO_EXTENSION) ?: 'jpg';
        $filename = Str::slug($art->title ?: 'later-n-comix-art') . '.' . $extension;

        $response = Storage::disk($disk)->download($path, $filename);
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }

    public function toggleLike(Request $request, Art $art): JsonResponse
    {
        abort_unless($art->status === 'published', 404);
        abort_if($this->contentSuspensions->isHidden($art), 404, 'Art not found.');

        $liked = false;

        DB::transaction(function () use ($request, $art, &$liked) {
            $existing = ArtLike::query()
                ->where('art_id', $art->id)
                ->where('user_id', $request->user()->id)
                ->first();

            if ($existing) {
                $existing->delete();
                $art->update(['likes' => max(0, ((int) $art->likes) - 1)]);
                $liked = false;
                return;
            }

            ArtLike::create([
                'art_id' => $art->id,
                'user_id' => $request->user()->id,
            ]);
            $art->increment('likes');
            $liked = true;
        });

        return response()->json([
            'liked' => $liked,
            'likes' => max(0, (int) $art->fresh()->likes),
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

    private function abortUnlessDownloadable(Art $art): void
    {
        abort_unless($art->status === 'published', 404);
        abort_if($this->contentSuspensions->isHidden($art), 404, 'Art not found.');
    }

    private function downloadImage(Art $art, string $imageId): ?ArtImage
    {
        if ($imageId !== '') {
            return ArtImage::where('art_id', $art->id)->where('id', $imageId)->firstOrFail();
        }

        return $art->images()->first();
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
