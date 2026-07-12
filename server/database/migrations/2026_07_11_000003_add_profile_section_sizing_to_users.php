<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('profile_board_min_height')->default(760)->after('profile_nav_h');
            $table->unsignedSmallInteger('profile_arts_tile_width')->default(220)->after('profile_board_min_height');
            $table->unsignedSmallInteger('profile_sticker_size')->default(112)->after('profile_arts_tile_width');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'profile_board_min_height',
                'profile_arts_tile_width',
                'profile_sticker_size',
            ]);
        });
    }
};
