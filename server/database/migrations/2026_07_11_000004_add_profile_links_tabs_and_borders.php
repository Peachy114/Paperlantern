<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_borders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('image_path');
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_default', 'sort_order']);
            $table->index(['user_id', 'sort_order']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('profile_show_cover')->default(true)->after('profile_sticker_size');
            $table->unsignedTinyInteger('profile_cover_width')->default(100)->after('profile_show_cover');
            $table->boolean('profile_background_has_gradient')->default(false)->after('profile_cover_width');
            $table->json('profile_tabs_config')->nullable()->after('profile_background_has_gradient');
            $table->json('profile_links')->nullable()->after('profile_tabs_config');
            $table->foreignUuid('profile_border_id')
                ->nullable()
                ->after('profile_links')
                ->constrained('profile_borders')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['profile_border_id']);
            $table->dropColumn([
                'profile_show_cover',
                'profile_cover_width',
                'profile_background_has_gradient',
                'profile_tabs_config',
                'profile_links',
                'profile_border_id',
            ]);
        });

        Schema::dropIfExists('profile_borders');
    }
};
