<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Art;
use App\Models\FeatureBoost;
use App\Models\ProfileBorder;
use App\Models\User;
use App\Services\ArtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArtController extends Controller
{
    public function __construct(private ArtService $service) {}

    public function index(): JsonResponse
    {
        $arts = Art::query()
            ->select('arts.*')
            ->where('status', 'published')
            ->with(['images', 'user:id,name,username,role'])
            ->selectSub($this->activeBoostSubquery(), 'boosted_until')
            ->orderByRaw('CASE WHEN boosted_until IS NULL THEN 1 ELSE 0 END ASC')
            ->orderByDesc('boosted_until')
            ->orderByRaw('CASE WHEN public_sort_order IS NULL THEN 1 ELSE 0 END ASC')
            ->orderBy('public_sort_order')
            ->orderByDesc('views')
            ->latest()
            ->get();

        return response()->json($arts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'labels' => ['nullable', 'array', 'max:12'],
            'labels.*' => ['string', 'max:50'],
            'image' => ['required_without:images', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'images' => ['required_without:image', 'array', 'min:1', 'max:10'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'image_descriptions' => ['nullable', 'array', 'max:10'],
            'image_descriptions.*' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['status'] = 'published';
        $validated['moderation_status'] = 'approved';
        $validated['public_sort_order'] = ((int) Art::max('public_sort_order')) + 1;

        $art = $this->service->createArt($request->user(), $validated, $request);

        return response()->json($art->load(['images', 'user:id,name,username,role']), 201);
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'art_ids' => ['required', 'array'],
            'art_ids.*' => ['string', 'exists:arts,id'],
        ]);

        $boostedIds = FeatureBoost::where('target_type', 'art')
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now())
            ->pluck('target_id')
            ->all();

        $order = 1;
        foreach ($validated['art_ids'] as $artId) {
            if (in_array($artId, $boostedIds, true)) {
                continue;
            }

            Art::where('id', $artId)->update(['public_sort_order' => $order]);
            $order++;
        }

        return response()->json(['message' => 'Arts order updated.']);
    }

    public function featureArtist(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'exists:users,username'],
            'days' => ['required', 'integer', 'min:1', 'max:30'],
        ]);

        $artist = User::where('username', $validated['username'])
            ->where('role', 'storyteller')
            ->firstOrFail();

        $boost = FeatureBoost::create([
            'user_id' => $artist->id,
            'target_type' => 'artist_profile',
            'target_id' => $artist->id,
            'days' => $validated['days'],
            'credits_spent' => 0,
            'starts_at' => now(),
            'ends_at' => now()->addDays((int) $validated['days']),
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Artist featured.',
            'boost' => $boost,
        ], 201);
    }

    public function profileBorders(): JsonResponse
    {
        return response()->json(
            ProfileBorder::where('is_default', true)
                ->orderBy('sort_order')
                ->latest()
                ->get()
        );
    }

    public function storeProfileBorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'image' => ['required', 'file', 'mimes:png,webp,gif', 'max:10240'],
        ]);

        $border = ProfileBorder::create([
            'name' => $validated['name'],
            'image_path' => $request->file('image')->store('profile-borders/defaults', 'public'),
            'is_default' => true,
            'sort_order' => ((int) ProfileBorder::where('is_default', true)->max('sort_order')) + 1,
        ]);

        return response()->json($border, 201);
    }

    public function destroyProfileBorder(ProfileBorder $border): JsonResponse
    {
        abort_unless($border->is_default, 404);

        User::where('profile_border_id', $border->id)->update(['profile_border_id' => null]);
        $border->delete();

        return response()->json(['message' => 'Default profile border deleted.']);
    }

    private function activeBoostSubquery()
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
