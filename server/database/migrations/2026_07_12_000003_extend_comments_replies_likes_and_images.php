<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('comments')) {
            return;
        }

        Schema::table('comments', function (Blueprint $table) {
            if (! Schema::hasColumn('comments', 'parent_id')) {
                $table->foreignUuid('parent_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('comments')
                    ->cascadeOnDelete();
            }
            if (! Schema::hasColumn('comments', 'likes_count')) {
                $table->unsignedBigInteger('likes_count')->default(0)->after('is_pinned');
            }
            if (! Schema::hasColumn('comments', 'replies_count')) {
                $table->unsignedBigInteger('replies_count')->default(0)->after('likes_count');
            }
            if (! Schema::hasColumn('comments', 'image_path')) {
                $table->string('image_path')->nullable()->after('image_url');
            }
            if (! Schema::hasColumn('comments', 'image_moderation_status')) {
                $table->string('image_moderation_status', 24)->nullable()->after('image_path');
            }
        });

        if (! Schema::hasTable('comment_likes')) {
            Schema::create('comment_likes', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('comment_id')->constrained('comments')->cascadeOnDelete();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['comment_id', 'user_id']);
                $table->index(['user_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_likes');

        if (! Schema::hasTable('comments')) {
            return;
        }

        Schema::table('comments', function (Blueprint $table) {
            if (Schema::hasColumn('comments', 'parent_id')) {
                $table->dropForeign(['parent_id']);
            }

            foreach (['parent_id', 'likes_count', 'replies_count', 'image_path', 'image_moderation_status'] as $column) {
                if (Schema::hasColumn('comments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
