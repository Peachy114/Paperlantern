<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PublicWorkController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChapterUnlockController;
use App\Http\Controllers\Api\PayMongoWebhookController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\SubscribeController;

use App\Http\Controllers\Api\Studio\WorkController; // Story teller
use App\Http\Controllers\Api\Studio\ChapterController;
use App\Http\Controllers\Api\Studio\StickyNoteController;
use App\Http\Controllers\Api\Studio\ViolationController;
use App\Http\Controllers\Api\EarningsController;
use App\Http\Controllers\Api\SuperAdmin\WithdrawalController;
use App\Http\Controllers\Api\Studio\TrashController;
use App\Http\Controllers\Api\Studio\AnalyticsController;


use App\Http\Controllers\Api\SuperAdmin\SuperAdminController; //Super admin
use App\Http\Controllers\Api\SuperAdmin\ModerationController;
use App\Http\Controllers\Api\SuperAdmin\AnnouncementController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\SuperAdmin\TicketController as AdminTicketController;



// ── Public Auth ───────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);

    Route::get('/google/redirect',  [AuthController::class, 'googleRedirect']);
    Route::get('/google/callback',  [AuthController::class, 'googleCallback']);
});


// ── Public ────────────────────────────────────────────────────────────────────
Route::prefix('public')->group(function () {
    Route::get('/hero',            [PublicWorkController::class, 'hero']);
    Route::get('/weekly-chart',    [PublicWorkController::class, 'weeklyChart']);
    Route::get('/fresh-releases',  [PublicWorkController::class, 'freshReleases']);
    Route::get('/latest-chapters', [PublicWorkController::class, 'latestChapters']);
    Route::get('/announcements',    fn() => response()->json(app(\App\Services\AnnouncementService::class)->getByAudience('public')));
    Route::post('/subscribe', [SubscribeController::class, 'store']);
    

    Route::post('/webhooks/paymongo', [PayMongoWebhookController::class, 'handle'])
    ->withoutMiddleware(['auth:sanctum', \App\Http\Middleware\VerifyCsrfToken::class]);

    Route::get('/search',                                [PublicWorkController::class, 'search']);
    Route::get('/works/{work}',                          [PublicWorkController::class, 'showWork']);
    Route::get('/works/{work}/chapters',                 [PublicWorkController::class, 'showChapters']);
    Route::get('/works/{work}/chapters/{chapter}',       [PublicWorkController::class, 'showChapter']);
    Route::get('/works/{work}/chapters/{chapter}/like-status', [PublicWorkController::class, 'getLikeStatus']);
    Route::post('/works/{work}/chapters/{chapter}/like',       [PublicWorkController::class, 'toggleLike'])->middleware('auth:sanctum');
    Route::post('/works/{work}/chapters/{chapter}/view',       [PublicWorkController::class, 'recordView']);

    Route::get('/comics', [PublicWorkController::class, 'comics']);
});

// ── Authenticated (any role) ──────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'banned'])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('/me',          [AuthController::class, 'me']);
        Route::post('/logout',     [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    });
    Route::post('/auth/become-creator', [AuthController::class, 'becomeCreator']);
    Route::patch('/user/preferences', [AuthController::class, 'updatePreferences']);

    // Tickets
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
    Route::get('/tickets/{ticket}/replies', [TicketController::class, 'replies']);
    Route::post('/tickets/{ticket}/replies', [TicketController::class, 'storeReply']);

    //profile
    Route::get('/profile',        [AuthController::class, 'profile']);
    Route::post('/profile',       [AuthController::class, 'updateProfile']);
    Route::patch('/profile/password', [AuthController::class, 'updatePassword']);


    // ── Wallet balance & history ──────────────────────────────────────────────────────
    Route::get('/wallet',                     [WalletController::class, 'show']);
    Route::get('/wallet/transactions',        [WalletController::class, 'transactions']);
    // Credit packages & checkout
    Route::get('/credits/packages',           [WalletController::class, 'packages']);
    Route::post('/credits/checkout',          [WalletController::class, 'checkout']);
    // Chapter unlock
    Route::post('/chapters/{chapter:slug}/unlock', [ChapterUnlockController::class, 'unlock']);



    // ── Super Admin only ──────────────────────────────────────────────────────
    Route::middleware('role:super_admin')->prefix('admin')->group(function () {
        Route::get('dashboard',             [SuperAdminController::class, 'dashboard']);
        Route::get('users',                 [SuperAdminController::class, 'users']);
        Route::get('users/{user}',          [SuperAdminController::class, 'showUser']);
        Route::put('users/{user}/ban',      [SuperAdminController::class, 'banUser']);
        Route::put('users/{user}/unban',    [SuperAdminController::class, 'unbanUser']);
        Route::delete('users/{user}',       [SuperAdminController::class, 'deleteUser']);
        Route::delete('works/{work}',       [SuperAdminController::class, 'deleteWork']);
        Route::get('chapters/{chapter}',    [SuperAdminController::class, 'viewChapter']);
        Route::delete('chapters/{chapter}', [SuperAdminController::class, 'deleteChapter']);
        Route::get('logs',                  [SuperAdminController::class, 'logs']);

        // Tickets
        Route::get('/tickets', [AdminTicketController::class, 'index']);
        Route::patch('/tickets/{ticket}', [AdminTicketController::class, 'update']);
        Route::delete('/tickets/{ticket}', [AdminTicketController::class, 'destroy']);
        Route::get('/tickets-export', [AdminTicketController::class, 'export']);
        Route::get('/tickets/{ticket}/replies', [AdminTicketController::class, 'replies']);
        Route::post('/tickets/{ticket}/replies', [AdminTicketController::class, 'storeReply']);
        Route::get('/tickets/{ticket}', [AdminTicketController::class, 'show']);

        Route::apiResource('announcements', AnnouncementController::class)->except(['show']);
        Route::get('/withdrawals',                      [WithdrawalController::class, 'index']);
        Route::put('/withdrawals/{withdrawal}/process', [WithdrawalController::class, 'process']);
        Route::get('/earnings', [EarningsController::class, 'adminOverview']);

        Route::prefix('moderation')->group(function () {
            Route::get('/',                                          [ModerationController::class, 'index']);
            Route::get('/violations',                                [ModerationController::class, 'violations']);
            Route::get('/users/{user}/violations',                   [ModerationController::class, 'userViolations']);

            // Chapters — resolve by slug, no work nesting needed
            Route::get('/chapters/{chapter:slug}',                   [ModerationController::class, 'show']);
            Route::put('/chapters/{chapter:slug}/approve',           [ModerationController::class, 'approve']);
            Route::put('/chapters/{chapter:slug}/violate',           [ModerationController::class, 'violate']);

            // Works — resolve by slug
            Route::get('/works/{work:slug}',                         [ModerationController::class, 'showWork']);
            Route::put('/works/{work:slug}/approve',                 [ModerationController::class, 'approveWork']);
            Route::put('/works/{work:slug}/violate',                 [ModerationController::class, 'violateWork']);

            // Sticky Notes — no slug, keep ID
            Route::get('/sticky-notes/{note}',                       [ModerationController::class, 'showStickyNote']);
            Route::put('/sticky-notes/{note}/approve',               [ModerationController::class, 'approveStickyNote']);
            Route::put('/sticky-notes/{note}/violate',               [ModerationController::class, 'violateStickyNote']);
        });
    });

    // ── Storyteller only ──────────────────────────────────────────────────────
    Route::middleware('role:storyteller')->prefix('studio')->group(function () {
        Route::apiResource('works',          WorkController::class);
        Route::apiResource('works.chapters', ChapterController::class);
        Route::get('/analytics/views', [AnalyticsController::class, 'views']);

        Route::get('/sticky-notes',                   [StickyNoteController::class, 'index']);
        Route::post('/sticky-notes',                  [StickyNoteController::class, 'store']);
        Route::patch('/sticky-notes/{note}/position', [StickyNoteController::class, 'updatePosition']);
        Route::delete('/sticky-notes/{note}',         [StickyNoteController::class, 'destroy']);

        Route::get('/announcements', fn() => response()->json(app(\App\Services\AnnouncementService::class)->getByAudience('studio')));
        Route::get('/my-violations',            [ViolationController::class, 'myViolations']);

        Route::get('/earnings',                 [EarningsController::class, 'show']);
        Route::get('/earnings/history',         [EarningsController::class, 'history']);
        Route::post('/earnings/withdraw',       [EarningsController::class, 'withdraw']);
        Route::get('/earnings/withdrawals',     [EarningsController::class, 'withdrawalHistory']);


        Route::prefix('trash')->group(function () {
            // Works
            Route::get('/works', [TrashController::class, 'works']);
            Route::post('/works/{slug}/restore', [TrashController::class, 'restoreWork']);
            Route::delete('/works/{slug}', [TrashController::class, 'forceDeleteWork']);

            // Chapters
            Route::get('/chapters', [TrashController::class, 'chapters']);
            Route::post('/chapters/{slug}/restore', [TrashController::class, 'restoreChapter']);
            Route::delete('/chapters/{slug}', [TrashController::class, 'forceDeleteChapter']);
        });

        Route::post('/works/{slug}/trash', [WorkController::class, 'trash']);
        Route::post('/works/{work}/chapters/{chapter}/trash', [ChapterController::class, 'trash']);
    });

    // ── All readers ───────────────────────────────────────────────────────────
    Route::middleware('role:wanderer,storyteller,super_admin')->group(function () {
        // coming soon
    });

});