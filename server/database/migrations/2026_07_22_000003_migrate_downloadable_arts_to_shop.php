<?php

use App\Models\ShopItem;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shop_items') || ! Schema::hasTable('arts')) {
            return;
        }

        if (! Schema::hasColumn('shop_items', 'source_art_id')) {
            Schema::table('shop_items', function (Blueprint $table) {
                $table->uuid('source_art_id')->nullable()->after('user_id')->index();
            });
        }

        $query = DB::table('arts')
            ->whereNull('deleted_at')
            ->where(function ($query) {
                $query->whereIn('download_policy', ['free', 'paid']);

                if (Schema::hasTable('art_download_files')) {
                    $query->orWhereExists(function ($exists) {
                        $exists->selectRaw('1')
                            ->from('art_download_files')
                            ->whereColumn('art_download_files.art_id', 'arts.id');
                    });
                }
            });

        $query->orderBy('created_at')->chunkById(100, function ($arts) {
            foreach ($arts as $art) {
                if (DB::table('shop_items')->where('source_art_id', $art->id)->exists()) {
                    continue;
                }

                $imagePath = $art->image_path;
                if (Schema::hasTable('art_images')) {
                    $firstImage = DB::table('art_images')
                        ->where('art_id', $art->id)
                        ->orderBy('sort_order')
                        ->value('image_path');
                    $imagePath = $firstImage ?: $imagePath;
                }

                $shopItemId = (string) Str::uuid();
                DB::table('shop_items')->insert([
                    'id' => $shopItemId,
                    'user_id' => $art->user_id,
                    'source_art_id' => $art->id,
                    'title' => $art->title,
                    'slug' => ShopItem::generateSlug($art->title, $art->user_id),
                    'description' => $art->description,
                    'type' => 'download',
                    'labels' => $art->labels,
                    'status' => $art->status === 'published' ? 'published' : 'draft',
                    'image_path' => $imagePath,
                    'download_policy' => $art->download_policy === 'free' ? 'free' : 'paid',
                    'credit_cost' => $art->download_policy === 'free'
                        ? 0
                        : max(1, (int) ($art->download_credits ?: 1)),
                    'usage' => json_encode(['downloads' => true]),
                    'likes_count' => (int) ($art->likes ?? 0),
                    'downloads_count' => (int) ($art->downloads_count ?? 0),
                    'created_at' => $art->created_at,
                    'updated_at' => now(),
                ]);

                if (! Schema::hasTable('art_download_files')) {
                    continue;
                }

                $files = DB::table('art_download_files')
                    ->where('art_id', $art->id)
                    ->orderBy('sort_order')
                    ->get();

                foreach ($files as $file) {
                    DB::table('shop_item_files')->insert([
                        'id' => (string) Str::uuid(),
                        'shop_item_id' => $shopItemId,
                        'file_path' => $file->file_path,
                        'original_name' => $file->original_name,
                        'mime_type' => $file->mime_type,
                        'size_bytes' => (int) $file->size_bytes,
                        'sort_order' => (int) $file->sort_order,
                        'created_at' => $file->created_at,
                        'updated_at' => $file->updated_at,
                    ]);
                }
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('shop_items') || ! Schema::hasColumn('shop_items', 'source_art_id')) {
            return;
        }

        DB::table('shop_items')->whereNotNull('source_art_id')->delete();

        Schema::table('shop_items', function (Blueprint $table) {
            $table->dropIndex(['source_art_id']);
            $table->dropColumn('source_art_id');
        });
    }
};
