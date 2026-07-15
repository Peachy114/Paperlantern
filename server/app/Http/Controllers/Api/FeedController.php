<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Art;
use App\Models\ArtistSticker;
use App\Models\CommissionService;
use App\Models\FeedPost;
use App\Models\FeedPostLike;
use App\Models\Ticket;
use App\Models\User;
use App\Models\UserFollow;
use App\Models\Work;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeedController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $followingIds = UserFollow::where('follower_id', $user->id)->pluck('followee_id');

        $posts = FeedPost::query()
            ->with($this->relations())
            ->where('status', 'published')
            ->where(function ($query) use ($user, $followingIds) {
                $query->where('audience', 'all')
                    ->orWhere('user_id', $user->id);

                if ($followingIds->isNotEmpty()) {
                    $query->orWhere(function ($inner) use ($followingIds) {
                        $inner->where('audience', 'followers')
                            ->whereIn('user_id', $followingIds);
                    });
                }
            })
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => collect($posts->items())->map(fn(FeedPost $post) => self::format($post)),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:1000'],
            'audience' => ['required', 'in:all,followers'],
            'comments_enabled' => ['sometimes', 'boolean'],
            'attached_work_id' => ['nullable', 'string', 'exists:works,id'],
            'attached_art_id' => ['nullable', 'string', 'exists:arts,id'],
            'attached_commission_service_id' => ['nullable', 'string', 'exists:commission_services,id'],
            'sticker_id' => ['nullable', 'string', 'exists:artist_stickers,id'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
        ]);

        $this->authorizeAttachment($request->user(), $validated);

        if (
            trim((string) ($validated['body'] ?? '')) === ''
            && ! $request->hasFile('images')
            && empty($validated['sticker_id'])
            && empty($validated['attached_work_id'])
            && empty($validated['attached_art_id'])
            && empty($validated['attached_commission_service_id'])
        ) {
            return response()->json([
                'message' => 'Write a post, add an image, sticker, or attach a work before posting.',
            ], 422);
        }

        $post = FeedPost::create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'] ?? null,
            'audience' => $validated['audience'],
            'comments_enabled' => $request->boolean('comments_enabled', true),
            'attached_work_id' => $validated['attached_work_id'] ?? null,
            'attached_art_id' => $validated['attached_art_id'] ?? null,
            'attached_commission_service_id' => $validated['attached_commission_service_id'] ?? null,
            'sticker_id' => $validated['sticker_id'] ?? null,
        ]);

        foreach ($request->file('images', []) as $index => $image) {
            $post->images()->create([
                'image_path' => $image->store("feeds/{$request->user()->id}", 'public'),
                'moderation_status' => 'pending',
                'sort_order' => $index + 1,
            ]);
        }

        return response()->json(self::format($post->fresh()->load($this->relations())), 201);
    }

    public function toggleFollow(Request $request, string $username): JsonResponse
    {
        $target = User::where('username', $username)
            ->where('role', '!=', 'super_admin')
            ->firstOrFail();

        if ($target->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot follow yourself.'], 422);
        }

        $follow = UserFollow::where('follower_id', $request->user()->id)
            ->where('followee_id', $target->id)
            ->first();

        if ($follow) {
            $follow->delete();
            $following = false;
        } else {
            UserFollow::create([
                'follower_id' => $request->user()->id,
                'followee_id' => $target->id,
            ]);
            $following = true;
        }

        return response()->json([
            'is_following' => $following,
            'followers_count' => $target->followers()->count(),
        ]);
    }

    public function toggleLike(Request $request, FeedPost $post): JsonResponse
    {
        abort_unless($post->status === 'published', 404);

        $liked = false;

        DB::transaction(function () use ($request, $post, &$liked) {
            $existing = FeedPostLike::where('feed_post_id', $post->id)
                ->where('user_id', $request->user()->id)
                ->first();

            if ($existing) {
                $existing->delete();
                $post->update(['likes_count' => max(0, ((int) $post->likes_count) - 1)]);
                return;
            }

            FeedPostLike::create([
                'feed_post_id' => $post->id,
                'user_id' => $request->user()->id,
            ]);
            $post->increment('likes_count');
            $liked = true;
        });

        return response()->json([
            'liked' => $liked,
            'likes_count' => (int) $post->fresh()->likes_count,
        ]);
    }

    public function report(Request $request, FeedPost $post): JsonResponse
    {
        abort_unless($post->status === 'published', 404);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:120'],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        $ticket = Ticket::create([
            'user_id' => $request->user()->id,
            'category' => 'other',
            'subject' => 'Feed post report',
            'message' => '',
            'status' => 'open',
            'source_type' => FeedPost::class,
            'source_id' => $post->id,
        ]);

        $supportNumber = 'LNC-' . now()->format('Ymd') . '-' . strtoupper(substr(str_replace('-', '', $ticket->id), 0, 6));
        $ticket->update([
            'subject' => "Feed post report {$supportNumber}",
            'message' => implode("\n\n", array_filter([
                "Support number: {$supportNumber}",
                "Reported feed post: {$post->id}",
                "Reason: {$validated['reason']}",
                $validated['details'] ?? null,
            ])),
        ]);

        return response()->json([
            'message' => 'Report sent to support.',
            'support_number' => $supportNumber,
            'ticket_id' => $ticket->id,
        ], 201);
    }

    public static function format(FeedPost $post): array
    {
        return [
            'id' => $post->id,
            'body' => $post->body,
            'audience' => $post->audience,
            'comments_enabled' => (bool) $post->comments_enabled,
            'likes_count' => (int) $post->likes_count,
            'comments_count' => (int) $post->comments_count,
            'super_likes_count' => (int) ($post->super_likes_count ?? 0),
            'super_like_credits' => (float) ($post->super_like_credits ?? 0),
            'liked_by_me' => auth('sanctum')->check()
                ? $post->likes()->where('user_id', auth('sanctum')->id())->exists()
                : false,
            'created_at' => $post->created_at,
            'user' => [
                'id' => $post->user?->id,
                'name' => $post->user?->name,
                'username' => $post->user?->username,
                'avatar' => $post->user?->avatar,
                'artist_verified' => (bool) ($post->user?->artist_verified ?? false),
            ],
            'images' => $post->images
                ->filter(fn($image) => $image->moderation_status !== 'suspended')
                ->map(fn($image) => [
                    'id' => $image->id,
                    'image_path' => $image->image_path,
                    'sort_order' => $image->sort_order,
                ])->values(),
            'sticker' => $post->sticker ? [
                'id' => $post->sticker->id,
                'name' => $post->sticker->name,
                'image_path' => $post->sticker->image_path,
            ] : null,
            'attachment' => self::formatAttachment($post),
        ];
    }

    public static function publicForUser(User $user, ?User $viewer = null, int $limit = 30)
    {
        $isFollower = $viewer
            ? UserFollow::where('follower_id', $viewer->id)->where('followee_id', $user->id)->exists()
            : false;

        return FeedPost::query()
            ->with((new self)->relations())
            ->where('user_id', $user->id)
            ->where('status', 'published')
            ->where(function ($query) use ($user, $viewer, $isFollower) {
                $query->where('audience', 'all');
                if ($viewer && ($viewer->id === $user->id || $isFollower)) {
                    $query->orWhere('audience', 'followers');
                }
            })
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn(FeedPost $post) => self::format($post))
            ->values();
    }

    private function relations(): array
    {
        return [
            'user:id,name,username,avatar,artist_verified',
            'images',
            'sticker:id,name,image_path',
            'attachedWork:id,slug,title,type,cover,user_id',
            'attachedArt:id,slug,title,user_id',
            'attachedArt.images:id,art_id,image_path,sort_order',
            'attachedCommissionService:id,slug,title,image_path,user_id',
        ];
    }

    private static function formatAttachment(FeedPost $post): ?array
    {
        if ($post->attachedWork) {
            return [
                'type' => 'work',
                'id' => $post->attachedWork->id,
                'title' => $post->attachedWork->title,
                'subtitle' => $post->attachedWork->type === 'wattpad' ? 'Novel' : 'Webtoon',
                'image_path' => $post->attachedWork->cover,
                'href' => "/works/comix/{$post->attachedWork->slug}",
            ];
        }

        if ($post->attachedArt) {
            $image = $post->attachedArt->images->first();
            return [
                'type' => 'art',
                'id' => $post->attachedArt->id,
                'title' => $post->attachedArt->title,
                'subtitle' => 'Art',
                'image_path' => $image?->image_path,
                'href' => '/arts',
            ];
        }

        if ($post->attachedCommissionService) {
            return [
                'type' => 'commission',
                'id' => $post->attachedCommissionService->id,
                'title' => $post->attachedCommissionService->title,
                'subtitle' => 'Commission',
                'image_path' => $post->attachedCommissionService->image_path,
                'href' => '/commissions',
            ];
        }

        return null;
    }

    private function authorizeAttachment(User $user, array $validated): void
    {
        if (! empty($validated['attached_work_id'])) {
            Work::where('id', $validated['attached_work_id'])->where('user_id', $user->id)->firstOrFail();
        }

        if (! empty($validated['attached_art_id'])) {
            Art::where('id', $validated['attached_art_id'])->where('user_id', $user->id)->firstOrFail();
        }

        if (! empty($validated['attached_commission_service_id'])) {
            CommissionService::where('id', $validated['attached_commission_service_id'])->where('user_id', $user->id)->firstOrFail();
        }

        if (! empty($validated['sticker_id'])) {
            $sticker = ArtistSticker::findOrFail($validated['sticker_id']);
            abort_unless($sticker->user_id === $user->id || $sticker->is_public || $user->purchasedArtistStickers()->where('artist_stickers.id', $sticker->id)->exists() || $user->subscribedArtistStickers()->where('artist_stickers.id', $sticker->id)->exists(), 403);
        }
    }
}
