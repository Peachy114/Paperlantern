<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_cover')->nullable()->after('avatar');
            $table->string('artist_title')->nullable()->after('bio');
        });

        Schema::create('artist_profile_blocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['image', 'text']);
            $table->text('text_content')->nullable();
            $table->string('image_path')->nullable();
            $table->enum('width', ['small', 'medium', 'large', 'full'])->default('medium');
            $table->enum('height', ['auto', 'short', 'medium', 'tall'])->default('auto');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artist_profile_blocks');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['profile_cover', 'artist_title']);
        });
    }
};
