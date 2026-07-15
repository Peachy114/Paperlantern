<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('artist_profile_blocks')) {
            return;
        }

        Schema::table('artist_profile_blocks', function (Blueprint $table) {
            if (! Schema::hasColumn('artist_profile_blocks', 'background_color')) {
                $table->string('background_color', 20)->nullable()->after('rotation');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'transparent_background')) {
                $table->boolean('transparent_background')->default(false)->after('background_color');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'overlay')) {
                $table->boolean('overlay')->default(false)->after('transparent_background');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'show_border')) {
                $table->boolean('show_border')->default(true)->after('overlay');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'border_color')) {
                $table->string('border_color', 20)->nullable()->after('show_border');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'border_radius')) {
                $table->integer('border_radius')->default(0)->after('border_color');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'font_family')) {
                $table->string('font_family')->nullable()->after('border_radius');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'font_color')) {
                $table->string('font_color', 20)->nullable()->after('font_family');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'locked')) {
                $table->boolean('locked')->default(false)->after('font_color');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'image_position_x')) {
                $table->integer('image_position_x')->default(50)->after('locked');
            }
            if (! Schema::hasColumn('artist_profile_blocks', 'image_position_y')) {
                $table->integer('image_position_y')->default(50)->after('image_position_x');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('artist_profile_blocks')) {
            return;
        }

        Schema::table('artist_profile_blocks', function (Blueprint $table) {
            foreach ([
                'background_color',
                'transparent_background',
                'overlay',
                'show_border',
                'border_color',
                'border_radius',
                'font_family',
                'font_color',
                'locked',
                'image_position_x',
                'image_position_y',
            ] as $column) {
                if (Schema::hasColumn('artist_profile_blocks', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
