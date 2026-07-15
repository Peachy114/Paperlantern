<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('user_follows')) {
            Schema::create('user_follows', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('follower_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('followee_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['follower_id', 'followee_id']);
                $table->index('followee_id');
            });
        }

        if (! Schema::hasTable('feed_posts')) {
            Schema::create('feed_posts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
                $table->text('body')->nullable();
                $table->enum('audience', ['all', 'followers'])->default('all');
                $table->boolean('comments_enabled')->default(true);
                $table->foreignUuid('attached_work_id')->nullable()->constrained('works')->nullOnDelete();
                $table->foreignUuid('attached_art_id')->nullable()->constrained('arts')->nullOnDelete();
                $table->foreignUuid('attached_commission_service_id')->nullable()->constrained('commission_services')->nullOnDelete();
                $table->foreignUuid('sticker_id')->nullable()->constrained('artist_stickers')->nullOnDelete();
                $table->enum('status', ['published', 'hidden'])->default('published');
                $table->unsignedInteger('likes_count')->default(0);
                $table->unsignedInteger('comments_count')->default(0);
                $table->timestamps();

                $table->index(['user_id', 'status', 'created_at']);
                $table->index(['audience', 'status', 'created_at']);
            });
        }

        if (! Schema::hasTable('feed_post_images')) {
            Schema::create('feed_post_images', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('feed_post_id')->constrained('feed_posts')->cascadeOnDelete();
                $table->string('image_path');
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['feed_post_id', 'sort_order']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('feed_post_images');
        Schema::dropIfExists('feed_posts');
        Schema::dropIfExists('user_follows');
    }
};
