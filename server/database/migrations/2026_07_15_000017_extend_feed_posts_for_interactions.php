<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('feed_posts')) {
            Schema::table('feed_posts', function (Blueprint $table) {
                if (! Schema::hasColumn('feed_posts', 'super_likes_count')) {
                    $table->unsignedBigInteger('super_likes_count')->default(0)->after('comments_count');
                }
                if (! Schema::hasColumn('feed_posts', 'super_like_credits')) {
                    $table->decimal('super_like_credits', 12, 2)->default(0)->after('super_likes_count');
                }
            });
        }

        if (Schema::hasTable('feed_post_images') && ! Schema::hasColumn('feed_post_images', 'moderation_status')) {
            Schema::table('feed_post_images', function (Blueprint $table) {
                $table->string('moderation_status')->default('pending')->after('image_path');
            });
        }

        if (! Schema::hasTable('feed_post_likes')) {
            Schema::create('feed_post_likes', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('feed_post_id')->constrained('feed_posts')->cascadeOnDelete();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['feed_post_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('feed_post_likes');

        if (Schema::hasTable('feed_post_images') && Schema::hasColumn('feed_post_images', 'moderation_status')) {
            Schema::table('feed_post_images', function (Blueprint $table) {
                $table->dropColumn('moderation_status');
            });
        }

        if (Schema::hasTable('feed_posts')) {
            Schema::table('feed_posts', function (Blueprint $table) {
                foreach (['super_like_credits', 'super_likes_count'] as $column) {
                    if (Schema::hasColumn('feed_posts', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
