<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArtistSticker;
use App\Models\ShopItem;
use App\Models\ShopItemPurchase;
use App\Repositories\WalletRepository;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class PublicShopController extends Controller
{
    public function __construct(
        private WalletRepository $wallets,
        private CommissionService $commissions,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $limit = max(1, min(30, (int) $request->query('limit', 20)));

        $downloads = ShopItem::query()
            ->where('status', 'published')
            ->with([
                'files',
                'user:id,name,username,avatar,artist_verified',
            ])
            ->latest()
            ->paginate($limit)
            ->through(fn(ShopItem $item) => $this->formatShopItem($item));

        $stickers = ArtistSticker::query()
            ->with('user:id,name,username,avatar,role')
            ->where('is_public', true)
            ->orderBy('sort_order')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn(ArtistSticker $sticker) => $this->formatSticker($sticker))
            ->values();

        return response()->json([
            'downloads' => $downloads,
            'stickers' => $stickers,
        ]);
    }

    private function formatShopItem(ShopItem $item): array
    {
        return [
            'id' => $item->id,
            'type' => $item->type,
            'title' => $item->title,
            'slug' => $item->slug,
            'description' => $item->description,
            'labels' => $item->labels ?? [],
            'image_path' => $item->image_path,
            'download_policy' => $item->download_policy,
            'credit_cost' => $item->download_policy === 'paid' ? (int) $item->credit_cost : 0,
            'download_unlocked' => $this->unlockedFor($item, request()->user()),
            'downloads_count' => (int) $item->downloads_count,
            'likes' => (int) $item->likes_count,
            'comments_count' => 0,
            'files_count' => $item->files->count(),
            'usage' => $item->usage ?? [],
            'created_at' => $item->created_at,
            'href' => '/shop',
            'artist' => $item->user ? [
                'id' => $item->user->id,
                'name' => $item->user->name,
                'username' => $item->user->username,
                'avatar' => $item->user->avatar,
                'verified' => (bool) $item->user->artist_verified,
            ] : null,
        ];
    }

    public function purchase(Request $request, ShopItem $shopItem): JsonResponse
    {
        abort_unless($shopItem->status === 'published', 404);
        $user = $request->user();

        if ($shopItem->user_id === $user->id) {
            return response()->json([
                'message' => 'You cannot buy your own shop product from the public page.',
                'unlocked' => false,
            ], 422);
        }

        if ($shopItem->download_policy === 'free') {
            return response()->json([
                'message' => 'This product is free to download.',
                'unlocked' => true,
                'credit_cost' => 0,
            ]);
        }

        if ($this->unlockedFor($shopItem, $user)) {
            return response()->json([
                'message' => 'Shop product already unlocked.',
                'unlocked' => true,
                'credit_cost' => (int) $shopItem->credit_cost,
            ]);
        }

        $cost = max(1, (int) $shopItem->credit_cost);
        $wallet = $this->wallets->findOrCreateByUser($user->id);

        if ($wallet->balance < $cost) {
            return response()->json([
                'message' => 'Insufficient credits.',
                'balance' => $wallet->balance,
                'requires_top_up' => true,
                'credit_cost' => $cost,
            ], 402);
        }

        $result = DB::transaction(function () use ($user, $shopItem, $cost, $wallet) {
            $transaction = $this->wallets->debit($wallet, $cost, [
                'source' => 'shop_download',
                'description' => "Shop Download - {$shopItem->title}",
                'meta' => ['shop_item_id' => $shopItem->id, 'cost' => $cost],
            ]);

            if ($transaction === false) {
                return [
                    'success' => false,
                    'message' => 'Insufficient credits.',
                    'balance' => $wallet->fresh()->balance,
                    'requires_top_up' => true,
                ];
            }

            ShopItemPurchase::create([
                'user_id' => $user->id,
                'shop_item_id' => $shopItem->id,
                'credit_cost' => $cost,
            ]);

            $shopItem->increment('downloads_count');
            $shopItem->loadMissing('user');

            if ($shopItem->user) {
                $this->commissions->recordEarning($user, $shopItem->user, $cost, 'shop_download', $shopItem);
            }

            return [
                'success' => true,
                'message' => 'Shop product unlocked.',
                'balance' => $transaction->balance_after,
                'unlocked' => true,
            ];
        });

        return response()->json($result, $result['success'] ? 200 : 402);
    }

    public function download(Request $request, ShopItem $shopItem): StreamedResponse|JsonResponse
    {
        abort_unless($shopItem->status === 'published', 404);
        $shopItem->loadMissing('files');

        if ($shopItem->download_policy === 'paid' && ! $this->unlockedFor($shopItem, $request->user())) {
            return response()->json([
                'message' => 'Buy this shop product before downloading.',
                'requires_purchase' => true,
                'credit_cost' => (int) $shopItem->credit_cost,
            ], $request->user() ? 402 : 401);
        }

        $files = $shopItem->files->filter(fn($file) => Storage::disk('local')->exists($file->file_path))->values();
        if ($files->isEmpty()) {
            return response()->json(['message' => 'Shop files were not found.'], 404);
        }

        if ($files->count() === 1) {
            $file = $files->first();

            return Storage::disk('local')->download(
                $file->file_path,
                $file->original_name ?: $this->downloadName($shopItem)
            );
        }

        $zipPath = storage_path('app/tmp/shop-downloads/' . $shopItem->id . '-' . now()->timestamp . '.zip');
        File::ensureDirectoryExists(dirname($zipPath));

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return response()->json(['message' => 'Could not prepare the download bundle.'], 500);
        }

        foreach ($files as $file) {
            $zip->addFile(
                Storage::disk('local')->path($file->file_path),
                $file->original_name ?: basename($file->file_path)
            );
        }
        $zip->close();

        return response()->download($zipPath, $this->downloadName($shopItem, 'zip'))->deleteFileAfterSend(true);
    }

    private function unlockedFor(ShopItem $item, $user): bool
    {
        if ($item->download_policy === 'free') {
            return true;
        }

        if (! $user) {
            return false;
        }

        return ShopItemPurchase::where('user_id', $user->id)
            ->where('shop_item_id', $item->id)
            ->exists();
    }

    private function downloadName(ShopItem $item, string $extension = 'zip'): string
    {
        $base = str($item->title)->slug()->value() ?: 'shop-product';

        return "{$base}.{$extension}";
    }

    private function formatSticker(ArtistSticker $sticker): array
    {
        return [
            'id' => $sticker->id,
            'type' => 'sticker',
            'name' => $sticker->name,
            'bundle_name' => $sticker->bundle_name,
            'image_path' => $sticker->image_path,
            'is_free' => (bool) $sticker->is_free,
            'credit_cost' => (int) ($sticker->is_free ? 0 : max(1, $sticker->credit_cost ?? 1)),
            'subscription_free' => (bool) $sticker->subscription_free,
            'usage' => [
                'comments' => true,
                'profile' => true,
                'backgrounds' => true,
                'messages' => true,
            ],
            'href' => '/noble-royalty',
            'artist' => $sticker->user ? [
                'id' => $sticker->user->id,
                'name' => $sticker->user->name,
                'username' => $sticker->user->username,
                'avatar' => $sticker->user->avatar,
            ] : null,
        ];
    }
}
