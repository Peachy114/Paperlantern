<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('profile_cover_position_x', 5, 2)->default(50)->after('profile_cover');
            $table->decimal('profile_cover_position_y', 5, 2)->default(50)->after('profile_cover_position_x');
            $table->decimal('avatar_position_x', 5, 2)->default(50)->after('profile_cover_position_y');
            $table->decimal('avatar_position_y', 5, 2)->default(50)->after('avatar_position_x');
            $table->boolean('show_public_links')->default(true)->after('artist_title');
        });

        Schema::table('artist_profile_blocks', function (Blueprint $table) {
            $table->string('image_url')->nullable()->after('image_path');
            $table->foreignUuid('source_art_image_id')
                ->nullable()
                ->after('image_url')
                ->constrained('art_images')
                ->nullOnDelete();
            $table->boolean('is_sticker')->default(false)->after('source_art_image_id');
            $table->decimal('x', 5, 2)->default(0)->after('height');
            $table->decimal('y', 5, 2)->default(0)->after('x');
            $table->decimal('w', 5, 2)->default(33)->after('y');
            $table->decimal('h', 5, 2)->default(30)->after('w');
            $table->unsignedTinyInteger('padding_x')->default(0)->after('h');
            $table->unsignedTinyInteger('padding_y')->default(0)->after('padding_x');
            $table->enum('fit_mode', ['contain', 'cover', 'stretch'])->default('cover')->after('padding_y');
            $table->unsignedSmallInteger('font_size')->default(16)->after('fit_mode');
            $table->unsignedInteger('z_index')->default(1)->after('font_size');
        });
    }

    public function down(): void
    {
        Schema::table('artist_profile_blocks', function (Blueprint $table) {
            $table->dropForeign(['source_art_image_id']);
            $table->dropColumn([
                'image_url',
                'source_art_image_id',
                'is_sticker',
                'x',
                'y',
                'w',
                'h',
                'padding_x',
                'padding_y',
                'fit_mode',
                'font_size',
                'z_index',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'profile_cover_position_x',
                'profile_cover_position_y',
                'avatar_position_x',
                'avatar_position_y',
                'show_public_links',
            ]);
        });
    }
};
