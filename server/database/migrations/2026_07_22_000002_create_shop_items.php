<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shop_items')) {
            Schema::create('shop_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('title');
                $table->string('slug');
                $table->text('description')->nullable();
                $table->string('type')->default('download');
                $table->json('labels')->nullable();
                $table->string('status')->default('draft');
                $table->string('image_path')->nullable();
                $table->string('download_policy')->default('paid');
                $table->unsignedInteger('credit_cost')->default(1);
                $table->json('usage')->nullable();
                $table->unsignedInteger('likes_count')->default(0);
                $table->unsignedInteger('downloads_count')->default(0);
                $table->timestamps();
                $table->softDeletes();

                $table->unique(['user_id', 'slug']);
                $table->index(['status', 'type']);
                $table->index(['user_id', 'status']);
            });
        }

        if (! Schema::hasTable('shop_item_files')) {
            Schema::create('shop_item_files', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('shop_item_id')->constrained('shop_items')->cascadeOnDelete();
                $table->string('file_path');
                $table->string('original_name')->nullable();
                $table->string('mime_type')->nullable();
                $table->unsignedBigInteger('size_bytes')->default(0);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['shop_item_id', 'sort_order']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_item_files');
        Schema::dropIfExists('shop_items');
    }
};
