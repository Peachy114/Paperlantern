<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_background_color', 20)->nullable()->after('show_public_links');
            $table->string('profile_background_gradient_from', 20)->nullable()->after('profile_background_color');
            $table->string('profile_background_gradient_to', 20)->nullable()->after('profile_background_gradient_from');
            $table->string('profile_background_gradient_direction', 32)->default('to bottom')->after('profile_background_gradient_to');
            $table->string('profile_background_image')->nullable()->after('profile_background_gradient_direction');
            $table->unsignedTinyInteger('profile_background_blur')->default(0)->after('profile_background_image');
            $table->unsignedSmallInteger('profile_banner_height')->default(288)->after('profile_background_blur');
            $table->decimal('profile_avatar_frame_x', 5, 2)->default(50)->after('profile_banner_height');
            $table->decimal('profile_avatar_frame_y', 5, 2)->default(100)->after('profile_avatar_frame_x');
            $table->unsignedTinyInteger('profile_avatar_border_width')->default(4)->after('profile_avatar_frame_y');
            $table->string('profile_avatar_border_color', 20)->nullable()->after('profile_avatar_border_width');
            $table->unsignedTinyInteger('profile_avatar_border_radius')->default(100)->after('profile_avatar_border_color');
            $table->enum('profile_nav_layout', ['together', 'separate'])->default('together')->after('profile_avatar_border_radius');
            $table->decimal('profile_nav_x', 5, 2)->default(0)->after('profile_nav_layout');
            $table->decimal('profile_nav_y', 6, 2)->default(0)->after('profile_nav_x');
            $table->decimal('profile_nav_w', 5, 2)->default(100)->after('profile_nav_y');
            $table->unsignedSmallInteger('profile_nav_h')->default(32)->after('profile_nav_w');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'profile_background_color',
                'profile_background_gradient_from',
                'profile_background_gradient_to',
                'profile_background_gradient_direction',
                'profile_background_image',
                'profile_background_blur',
                'profile_banner_height',
                'profile_avatar_frame_x',
                'profile_avatar_frame_y',
                'profile_avatar_border_width',
                'profile_avatar_border_color',
                'profile_avatar_border_radius',
                'profile_nav_layout',
                'profile_nav_x',
                'profile_nav_y',
                'profile_nav_w',
                'profile_nav_h',
            ]);
        });
    }
};
