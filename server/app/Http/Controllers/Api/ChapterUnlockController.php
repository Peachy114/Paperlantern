<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\ChapterUnlock;
use App\Services\WalletService;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChapterUnlockController extends Controller
{
    private const DEFAULT_CHAPTER_COST = 3;

    public function __construct(
        private WalletService     $walletService,
        private CommissionService $commissionService,
    ) {}

    public function unlock(Request $request, Chapter $chapter): JsonResponse
    {
        $user = $request->user();
        $cost = $chapter->credits_required ?? self::DEFAULT_CHAPTER_COST;

        $alreadyUnlocked = ChapterUnlock::where('user_id', $user->id)
            ->where('chapter_id', $chapter->id)
            ->exists();

        if ($alreadyUnlocked) {
            return response()->json([
                'success' => true,
                'message' => 'Chapter already unlocked.',
                'balance' => $user->wallet->balance,
                'chapter' => ['id' => $chapter->id, 'title' => $chapter->title],
            ]);
        }

        $result = $this->walletService->spendCredits($user, $chapter, $cost);

        if (! $result['success']) {
            return response()->json([
                'success'         => false,
                'message'         => $result['message'],
                'balance'         => $result['balance'],
                'requires_top_up' => true,
            ], 402);
        }

        ChapterUnlock::create([
            'user_id'    => $user->id,
            'chapter_id' => $chapter->id,
        ]);

        // ✅ Credit the storyteller's earnings
        $this->commissionService->splitEarnings($user, $chapter, $cost);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'balance' => $result['balance'],
            'chapter' => ['id' => $chapter->id, 'title' => $chapter->title],
        ]);
    }
}