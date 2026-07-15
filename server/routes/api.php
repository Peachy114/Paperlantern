<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PublicWorkController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChapterUnlockController;
use App\Http\Controllers\Api\PayMongoWebhookController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\SubscribeController;
use App\Http\Controllers\Api\ArtistProfileController;
use App\Http\Controllers\Api\FeatureBoostController;
use App\Http\Controllers\Api\PublicArtController;
use App\Http\Controllers\Api\PublicCommissionController;
use App\Http\Controllers\Api\CommissionAccountController;
use App\Http\Controllers\Api\CommissionMessageController;
use App\Http\Controllers\Api\PaymentSettingsController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\SuperLikeController;
use App\Http\Controllers\Api\ArtistStickerLibraryController;
use App\Http\Controllers\Api\AccountLibraryController;
use App\Http\Controllers\Api\PageLayoutController;
use App\Http\Controllers\Api\NobleRoyaltyController;
use App\Http\Controllers\Api\LabelingController;
use App\Http\Controllers\Api\FeedController;

use App\Http\Controllers\Api\Studio\WorkController; // Story teller
use App\Http\Controllers\Api\Studio\ChapterController;
use App\Http\Controllers\Api\Studio\StickyNoteController;
use App\Http\Controllers\Api\Studio\ViolationController;
use App\Http\Controllers\Api\Studio\ArtController;
use App\Http\Controllers\Api\Studio\CommissionController as StudioCommissionController;
use App\Http\Controllers\Api\EarningsController;
use App\Http\Controllers\Api\SuperAdmin\WithdrawalController;
use App\Http\Controllers\Api\Studio\TrashController;
use App\Http\Controllers\Api\Studio\AnalyticsController;


use App\Http\Controllers\Api\SuperAdmin\SuperAdminController; //Super admin
use App\Http\Controllers\Api\SuperAdmin\ModerationController;
use App\Http\Controllers\Api\SuperAdmin\AnnouncementController;
use App\Http\Controllers\Api\SuperAdmin\ArtController as AdminArtController;
use App\Http\Controllers\Api\SuperAdmin\CommissionApplicationController;
use App\Http\Controllers\Api\SuperAdmin\CommissionAdminController;
use App\Http\Controllers\Api\SuperAdmin\CreditPackageController as AdminCreditPackageController;
use App\Http\Controllers\Api\SuperAdmin\RevenueController as AdminRevenueController;
use App\Http\Controllers\Api\SuperAdmin\SuperLikeAwardController;
use App\Http\Controllers\Api\SuperAdmin\PageLayoutController as AdminPageLayoutController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\SuperAdmin\TicketController as AdminTicketController;
use App\Http\Controllers\Api\SuperAdmin\TransactionController as AdminTransactionController;



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
    Route::get('/home',            [PublicWorkController::class, 'home']);
    Route::get('/weekly-chart',    [PublicWorkController::class, 'weeklyChart']);
    Route::get('/fresh-releases',  [PublicWorkController::class, 'freshReleases']);
    Route::get('/latest-chapters', [PublicWorkController::class, 'latestChapters']);
    Route::get('/announcements',    fn() => response()->json(app(\App\Services\AnnouncementService::class)->getByAudience('public')));
    Route::post('/subscribe', [SubscribeController::class, 'store']);
    

    Route::post('/webhooks/paymongo', [PayMongoWebhookController::class, 'handle'])
    ->withoutMiddleware(['auth:sanctum', \App\Http\Middleware\VerifyCsrfToken::class]);

    Route::get('/search',                                [PublicWorkController::class, 'search']);
    Route::get('/works/{work}',                          [PublicWorkController::class, 'showWork']);
    Route::get('/works/{work}/engagement-status',        [PublicWorkController::class, 'getWorkEngagementStatus']);
    Route::post('/works/{work}/like',                    [PublicWorkController::class, 'toggleWorkLike'])->middleware('auth:sanctum');
    Route::post('/works/{work}/favorite',                [PublicWorkController::class, 'toggleWorkFavorite'])->middleware('auth:sanctum');
    Route::get('/works/{work}/chapters',                 [PublicWorkController::class, 'showChapters']);
    Route::get('/works/{work}/chapters/{chapter}',       [PublicWorkController::class, 'showChapter']);
    Route::get('/works/{work}/chapters/{chapter}/like-status', [PublicWorkController::class, 'getLikeStatus']);
    Route::post('/works/{work}/chapters/{chapter}/like',       [PublicWorkController::class, 'toggleLike'])->middleware('auth:sanctum');
    Route::post('/works/{work}/chapters/{chapter}/view',       [PublicWorkController::class, 'recordView']);

    Route::get('/comics', [PublicWorkController::class, 'comics']);
    Route::get('/arts', [PublicArtController::class, 'index']);
    Route::get('/arts/tags', [PublicArtController::class, 'tags']);
    Route::get('/arts/{art}', [PublicArtController::class, 'show']);
    Route::post('/arts/{art}/view', [PublicArtController::class, 'recordView']);
    Route::get('/arts/{art}/download', [PublicArtController::class, 'download']);
    Route::post('/arts/{art}/like', [PublicArtController::class, 'toggleLike'])->middleware('auth:sanctum');
    Route::get('/commissions', [PublicCommissionController::class, 'index']);
    Route::get('/commissions/{commission}', [PublicCommissionController::class, 'show']);
    Route::post('/commissions/{commission}/request', [PublicCommissionController::class, 'request'])->middleware('auth:sanctum');
    Route::get('/artists/{username}', [ArtistProfileController::class, 'show']);
    Route::post('/artists/{username}/follow', [FeedController::class, 'toggleFollow'])->middleware('auth:sanctum');
    Route::get('/users/{username}', [AccountLibraryController::class, 'publicProfile']);
    Route::get('/artists/{username}/stickers', [ArtistStickerLibraryController::class, 'artistStore']);
    Route::get('/comments/{type}/{id}', [CommentController::class, 'index']);
    Route::get('/super-like-awards', [SuperLikeController::class, 'awards']);
    Route::get('/page-layouts/{page}', [PageLayoutController::class, 'show']);
    Route::get('/labeling', [LabelingController::class, 'publicIndex']);
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
    Route::get('/payment-settings', [PaymentSettingsController::class, 'show']);
    Route::put('/payment-settings', [PaymentSettingsController::class, 'update']);

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
    Route::get('/credits/payments/{payment}', [WalletController::class, 'payment']);
    Route::post('/credits/payments/{payment}/simulate', [WalletController::class, 'simulatePayment']);
    Route::post('/comments/{comment}/like',   [CommentController::class, 'toggleLike']);
    Route::post('/comments/{comment}/report', [CommentController::class, 'report']);
    Route::patch('/comments/{comment}/pin',   [CommentController::class, 'pin']);
    Route::delete('/comments/{comment}',      [CommentController::class, 'destroy']);
    Route::post('/comments/{type}/{id}',      [CommentController::class, 'store']);
    Route::get('/account/favorites',          [AccountLibraryController::class, 'favorites']);
    Route::get('/account/comments',           [AccountLibraryController::class, 'comments']);
    Route::patch('/account/comments/{comment}/highlight', [AccountLibraryController::class, 'toggleCommentHighlight']);
    Route::get('/account/history',            [AccountLibraryController::class, 'history']);
    Route::get('/account/earnings',           [EarningsController::class, 'show']);
    Route::get('/account/earnings/history',   [EarningsController::class, 'history']);
    Route::post('/account/earnings/withdraw', [EarningsController::class, 'withdraw']);
    Route::get('/account/earnings/withdrawals', [EarningsController::class, 'withdrawalHistory']);
    Route::get('/account/commissions',        [CommissionAccountController::class, 'index']);
    Route::patch('/account/commissions/{order}', [CommissionAccountController::class, 'update']);
    Route::post('/account/commissions/{order}/accept-quote', [CommissionAccountController::class, 'acceptQuote']);
    Route::post('/account/commissions/{order}/pay-next-stage', [CommissionAccountController::class, 'payNextStage']);
    Route::post('/account/commissions/{order}/release', [CommissionAccountController::class, 'release']);
    Route::post('/account/commissions/{order}/pay-final-delivery', [CommissionAccountController::class, 'payFinalDelivery']);
    Route::post('/account/commissions/{order}/continue-stage', [CommissionAccountController::class, 'continueStage']);
    Route::post('/account/commissions/{order}/revisions', [CommissionAccountController::class, 'requestRevision']);
    Route::post('/account/commissions/{order}/rating', [CommissionAccountController::class, 'rate']);
    Route::get('/messages/commissions',       [CommissionMessageController::class, 'threads']);
    Route::get('/messages/preferences',       [CommissionMessageController::class, 'preferences']);
    Route::put('/messages/preferences',       [CommissionMessageController::class, 'updatePreferences']);
    Route::get('/messages/commissions/{order}', [CommissionMessageController::class, 'show']);
    Route::post('/messages/commissions/{order}/read', [CommissionMessageController::class, 'markRead']);
    Route::post('/messages/commissions/{order}', [CommissionMessageController::class, 'store']);
    Route::post('/messages/commission-submissions/{message}/approve', [CommissionMessageController::class, 'approveSubmission']);
    Route::post('/super-likes/{type}/{id}',   [SuperLikeController::class, 'store']);
    Route::post('/public/arts/{art}/download/purchase', [PublicArtController::class, 'purchaseDownload']);
    Route::get('/stickers/library',           [ArtistStickerLibraryController::class, 'library']);
    Route::post('/stickers/{sticker}/subscribe', [ArtistStickerLibraryController::class, 'subscribe']);
    Route::post('/stickers/{sticker}/purchase',  [ArtistStickerLibraryController::class, 'purchase']);
    Route::get('/noble-royalty',              [NobleRoyaltyController::class, 'index']);
    Route::post('/labeling/requests',         [LabelingController::class, 'requestLabel']);
    Route::post('/noble-royalty/borders',     [NobleRoyaltyController::class, 'storeBorder']);
    Route::post('/noble-royalty/message-backgrounds', [NobleRoyaltyController::class, 'storeMessageBackground']);
    Route::post('/noble-royalty/stickers/{sticker}/publish', [NobleRoyaltyController::class, 'publishSticker']);
    Route::post('/noble-royalty/borders/{border}/publish', [NobleRoyaltyController::class, 'publishBorder']);
    Route::post('/noble-royalty/subscriptions/{plan}/subscribe', [NobleRoyaltyController::class, 'subscribe']);
    Route::get('/feeds', [FeedController::class, 'index']);
    Route::post('/feeds', [FeedController::class, 'store']);
    Route::post('/feeds/{post}/like', [FeedController::class, 'toggleLike']);
    Route::post('/feeds/{post}/report', [FeedController::class, 'report']);
    Route::get('/boosts/prices',              [FeatureBoostController::class, 'prices']);
    Route::post('/boosts',                    [FeatureBoostController::class, 'store']);
    // Chapter unlock
    Route::post('/chapters/{chapter:slug}/unlock', [ChapterUnlockController::class, 'unlock']);



    // ── Super Admin only ──────────────────────────────────────────────────────
    Route::middleware('role:super_admin')->prefix('admin')->group(function () {
        Route::get('dashboard',             [SuperAdminController::class, 'dashboard']);
        Route::get('users',                 [SuperAdminController::class, 'users']);
        Route::get('users/{user}',          [SuperAdminController::class, 'showUser']);
        Route::put('users/{user}/ban',      [SuperAdminController::class, 'banUser']);
        Route::put('users/{user}/unban',    [SuperAdminController::class, 'unbanUser']);
        Route::patch('users/{user}/artist-verification', [SuperAdminController::class, 'updateArtistVerification']);
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
        Route::get('/transactions', [AdminTransactionController::class, 'index']);
        Route::get('/revenue', [AdminRevenueController::class, 'index']);
        Route::get('/payout-settings', [AdminRevenueController::class, 'showPayoutSettings']);
        Route::put('/payout-settings', [AdminRevenueController::class, 'updatePayoutSettings']);
        Route::post('/payouts/simulate', [AdminRevenueController::class, 'simulatePayouts']);
        Route::apiResource('credit-packages', AdminCreditPackageController::class)->except(['show']);
        Route::get('/earnings', [EarningsController::class, 'adminOverview']);
        Route::get('/commission-applications', [CommissionApplicationController::class, 'index']);
        Route::patch('/commission-applications/{profile}', [CommissionApplicationController::class, 'update']);
        Route::get('/commission-orders', [CommissionAdminController::class, 'orders']);
        Route::patch('/commission-orders/{order}', [CommissionAdminController::class, 'updateOrder']);
        Route::get('/commission-rating-appeals', [CommissionAdminController::class, 'ratingAppeals']);
        Route::patch('/commission-ratings/{rating}', [CommissionAdminController::class, 'updateRating']);
        Route::get('/commission-artist-terms', [CommissionAdminController::class, 'artistTerms']);
        Route::patch('/commission-artist-terms/{profile}', [CommissionAdminController::class, 'updateArtistTerms']);
        Route::get('/commission-orders/{order}/messages', [CommissionAdminController::class, 'messages']);
        Route::get('/commission-terms', [CommissionAdminController::class, 'terms']);
        Route::put('/commission-terms', [CommissionAdminController::class, 'updateTerms']);
        Route::get('/commission-categories', [CommissionAdminController::class, 'categories']);
        Route::post('/commission-categories', [CommissionAdminController::class, 'storeCategory']);
        Route::patch('/commission-categories/{category}', [CommissionAdminController::class, 'updateCategory']);
        Route::get('/labeling', [LabelingController::class, 'adminIndex']);
        Route::post('/labeling/labels', [LabelingController::class, 'storeLabel']);
        Route::patch('/labeling/labels/{label}', [LabelingController::class, 'updateLabel']);
        Route::patch('/labeling/requests/{labelRequest}', [LabelingController::class, 'updateRequest']);
        Route::get('/arts', [AdminArtController::class, 'index']);
        Route::post('/arts', [AdminArtController::class, 'store']);
        Route::post('/arts/reorder', [AdminArtController::class, 'reorder']);
        Route::post('/featured-artists', [AdminArtController::class, 'featureArtist']);
        Route::get('/profile-borders', [AdminArtController::class, 'profileBorders']);
        Route::post('/profile-borders', [AdminArtController::class, 'storeProfileBorder']);
        Route::delete('/profile-borders/{border}', [AdminArtController::class, 'destroyProfileBorder']);
        Route::get('/stickers', [AdminArtController::class, 'stickers']);
        Route::post('/stickers', [AdminArtController::class, 'storeSticker']);
        Route::delete('/stickers/{sticker}', [AdminArtController::class, 'destroySticker']);
        Route::get('/royalty-designs/{type}', [AdminArtController::class, 'royaltyDesigns']);
        Route::post('/royalty-designs', [AdminArtController::class, 'storeRoyaltyDesign']);
        Route::delete('/royalty-designs/{asset}', [AdminArtController::class, 'destroyRoyaltyDesign']);
        Route::get('/noble-royalty/subscription-plans', [NobleRoyaltyController::class, 'adminPlans']);
        Route::post('/noble-royalty/subscription-plans', [NobleRoyaltyController::class, 'storePlan']);
        Route::put('/noble-royalty/subscription-plans/{plan}', [NobleRoyaltyController::class, 'updatePlan']);
        Route::post('/noble-royalty/gifts', [NobleRoyaltyController::class, 'gift']);
        Route::get('/art-watermarks', [AdminArtController::class, 'watermarks']);
        Route::post('/art-watermarks', [AdminArtController::class, 'storeWatermark']);
        Route::post('/art-watermarks/{watermark}', [AdminArtController::class, 'updateWatermark']);
        Route::delete('/art-watermarks/{watermark}', [AdminArtController::class, 'destroyWatermark']);
        Route::put('/art-watermark-settings', [AdminArtController::class, 'updateWatermarkSettings']);
        Route::apiResource('super-like-awards', SuperLikeAwardController::class)->except(['show']);
        Route::get('/page-layouts/{page}', [AdminPageLayoutController::class, 'show']);
        Route::put('/page-layouts/{page}', [AdminPageLayoutController::class, 'update']);
        Route::delete('/page-layouts/{page}', [AdminPageLayoutController::class, 'reset']);
        Route::post('/page-layout-assets', [AdminPageLayoutController::class, 'uploadAsset']);

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

            Route::post('/content/{type}/{id}/suspend',              [ModerationController::class, 'suspendContent']);
            Route::put('/suspensions/{suspension}/restore',          [ModerationController::class, 'restoreSuspension']);
            Route::put('/comments/{comment}/image/approve',          [ModerationController::class, 'approveCommentImage']);
            Route::put('/comments/{comment}/image/suspend',          [ModerationController::class, 'suspendCommentImage']);
            Route::put('/commission-messages/{message}/image/approve', [ModerationController::class, 'approveCommissionMessageImage']);
            Route::put('/commission-messages/{message}/image/suspend', [ModerationController::class, 'suspendCommissionMessageImage']);
            Route::put('/commission-delivery-files/{file}/approve', [ModerationController::class, 'approveCommissionDeliveryFile']);
            Route::put('/commission-delivery-files/{file}/suspend', [ModerationController::class, 'suspendCommissionDeliveryFile']);
        });
    });

    // ── Storyteller only ──────────────────────────────────────────────────────
    Route::middleware('role:storyteller')->prefix('studio')->group(function () {
        Route::get('/arts',                 [ArtController::class, 'index']);
        Route::post('/arts',                [ArtController::class, 'store']);
        Route::get('/arts/trash',           [ArtController::class, 'trash']);
        Route::post('/arts/trash/{slug}/restore', [ArtController::class, 'restore']);
        Route::delete('/arts/trash/{slug}', [ArtController::class, 'forceDelete']);
        Route::get('/arts/{slug}',          [ArtController::class, 'show']);
        Route::post('/arts/{slug}',         [ArtController::class, 'update']);
        Route::delete('/arts/{slug}',       [ArtController::class, 'destroy']);
        Route::get('/commissions/profile',  [StudioCommissionController::class, 'show']);
        Route::post('/commissions/apply',   [StudioCommissionController::class, 'apply']);
        Route::patch('/commissions/profile', [StudioCommissionController::class, 'update']);
        Route::post('/commissions/services', [StudioCommissionController::class, 'storeService']);
        Route::post('/commissions/services/{service}', [StudioCommissionController::class, 'updateService']);
        Route::delete('/commissions/services/{service}', [StudioCommissionController::class, 'destroyService']);
        Route::patch('/commissions/orders/{order}', [StudioCommissionController::class, 'updateOrder']);
        Route::post('/commissions/orders/{order}/archive', [StudioCommissionController::class, 'archiveOrder']);
        Route::post('/commissions/orders/{order}/quote', [StudioCommissionController::class, 'quoteOrder']);
        Route::patch('/commissions/orders/{order}/stage', [StudioCommissionController::class, 'advanceOrderStage']);
        Route::post('/commissions/orders/{order}/delivery-files', [StudioCommissionController::class, 'uploadDeliveryFile']);
        Route::patch('/commissions/revisions/{revision}', [StudioCommissionController::class, 'updateRevision']);
        Route::patch('/commissions/ratings/{rating}/appeal', [StudioCommissionController::class, 'appealRating']);

        Route::apiResource('works',          WorkController::class);
        Route::post('/works/{work}/chapters/{chapter}/images', [ChapterController::class, 'storeImages']);
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

    Route::middleware('role:wanderer,storyteller')->prefix('artist-profile')->group(function () {
        Route::post('/header', [ArtistProfileController::class, 'updateHeader']);
        Route::post('/blocks', [ArtistProfileController::class, 'storeBlock']);
        Route::post('/blocks/reorder', [ArtistProfileController::class, 'reorderBlocks']);
        Route::post('/blocks/{block}', [ArtistProfileController::class, 'updateBlock']);
        Route::delete('/blocks/{block}', [ArtistProfileController::class, 'destroyBlock']);
        Route::get('/stickers', [ArtistProfileController::class, 'stickers']);
        Route::post('/stickers', [ArtistProfileController::class, 'storeSticker']);
        Route::delete('/stickers/{sticker}', [ArtistProfileController::class, 'destroySticker']);
        Route::post('/borders', [ArtistProfileController::class, 'storeBorder']);
        Route::delete('/borders/{border}', [ArtistProfileController::class, 'destroyBorder']);
    });

    // ── All readers ───────────────────────────────────────────────────────────
    Route::middleware('role:wanderer,storyteller,super_admin')->group(function () {
        // coming soon
    });

});
