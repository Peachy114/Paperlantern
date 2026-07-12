<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('work_likes')) {
            Schema::create('work_likes', function (Blueprint $table) {
                $table->string('id', 36)->primary();
                $table->string('work_id', 36);
                $table->foreign('work_id')->references('id')->on('works')->cascadeOnDelete();
                $table->string('user_id', 36);
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->timestamps();
                $table->unique(['work_id', 'user_id']);
            });
        }

        if (! Schema::hasTable('work_favorites')) {
            Schema::create('work_favorites', function (Blueprint $table) {
                $table->string('id', 36)->primary();
                $table->string('work_id', 36);
                $table->foreign('work_id')->references('id')->on('works')->cascadeOnDelete();
                $table->string('user_id', 36);
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->timestamps();
                $table->unique(['work_id', 'user_id']);
            });
        }

        Schema::table('works', function (Blueprint $table) {
            if (! Schema::hasColumn('works', 'work_likes_count')) {
                $table->unsignedBigInteger('work_likes_count')->default(0);
            }

            if (! Schema::hasColumn('works', 'favorites_count')) {
                $table->unsignedBigInteger('favorites_count')->default(0);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_favorites');
        Schema::dropIfExists('work_likes');

        Schema::table('works', function (Blueprint $table) {
            if (Schema::hasColumn('works', 'work_likes_count')) {
                $table->dropColumn('work_likes_count');
            }

            if (Schema::hasColumn('works', 'favorites_count')) {
                $table->dropColumn('favorites_count');
            }
        });
    }
};
