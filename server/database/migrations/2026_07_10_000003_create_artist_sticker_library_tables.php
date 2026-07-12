<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artist_sticker_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('artist_sticker_id')->constrained('artist_stickers')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'artist_sticker_id']);
            $table->index('artist_sticker_id');
        });

        Schema::create('artist_sticker_purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('artist_sticker_id')->constrained('artist_stickers')->cascadeOnDelete();
            $table->unsignedInteger('credits_spent')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'artist_sticker_id']);
            $table->index('artist_sticker_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artist_sticker_purchases');
        Schema::dropIfExists('artist_sticker_subscriptions');
    }
};
