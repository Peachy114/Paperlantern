<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // chapter revision history ----
        if (! Schema::hasTable('chapter_revisions')) {
            Schema::create('chapter_revisions', function (Blueprint $table) {
                $table->string('id', 36)->primary();
                $table->string('chapter_id', 36);
                $table->foreign('chapter_id')->references('id')->on('chapters')->cascadeOnDelete();
                $table->string('user_id', 36)->nullable();
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
                $table->string('source')->default('manual');
                $table->string('title')->nullable();
                $table->longText('content')->nullable();
                $table->text('artist_note')->nullable();
                $table->unsignedInteger('word_count')->default(0);
                $table->timestamps();

                $table->index(['chapter_id', 'created_at']);
            });
        }

        // in-app notifications ----
        if (! Schema::hasTable('app_notifications')) {
            Schema::create('app_notifications', function (Blueprint $table) {
                $table->string('id', 36)->primary();
                $table->string('user_id', 36);
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->string('category', 80);
                $table->string('title');
                $table->text('body')->nullable();
                $table->string('action_url')->nullable();
                $table->json('meta')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'read_at', 'created_at']);
                $table->index(['user_id', 'category']);
            });
        }

        // notification preferences ----
        if (! Schema::hasTable('notification_preferences')) {
            Schema::create('notification_preferences', function (Blueprint $table) {
                $table->string('id', 36)->primary();
                $table->string('user_id', 36);
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->json('reader_categories')->nullable();
                $table->json('creator_categories')->nullable();
                $table->boolean('in_app_enabled')->default(true);
                $table->boolean('email_enabled')->default(true);
                $table->boolean('push_enabled')->default(false);
                $table->boolean('digest_enabled')->default(false);
                $table->string('digest_frequency')->default('daily');
                $table->time('quiet_hours_start')->nullable();
                $table->time('quiet_hours_end')->nullable();
                $table->json('per_work_controls')->nullable();
                $table->timestamps();

                $table->unique('user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('app_notifications');
        Schema::dropIfExists('chapter_revisions');
    }
};
