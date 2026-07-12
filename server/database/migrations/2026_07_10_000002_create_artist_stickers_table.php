<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artist_stickers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('image_path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'sort_order']);
        });

        Schema::table('artist_profile_blocks', function (Blueprint $table) {
            $table->foreignUuid('source_sticker_id')
                ->nullable()
                ->after('source_art_image_id')
                ->constrained('artist_stickers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('artist_profile_blocks', function (Blueprint $table) {
            $table->dropForeign(['source_sticker_id']);
            $table->dropColumn('source_sticker_id');
        });

        Schema::dropIfExists('artist_stickers');
    }
};
