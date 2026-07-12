<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('art_likes')) {
            return;
        }

        Schema::create('art_likes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('art_id')->constrained('arts')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['art_id', 'user_id']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('art_likes');
    }
};
