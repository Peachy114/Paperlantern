<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('comments')) {
            return;
        }

        Schema::table('comments', function (Blueprint $table) {
            if (! Schema::hasColumn('comments', 'reaction_emoji')) {
                $table->string('reaction_emoji', 16)->nullable()->after('artist_sticker_id');
            }
            if (! Schema::hasColumn('comments', 'gif_url')) {
                $table->string('gif_url', 2048)->nullable()->after('reaction_emoji');
            }
            if (! Schema::hasColumn('comments', 'image_url')) {
                $table->string('image_url', 2048)->nullable()->after('gif_url');
            }
            if (! Schema::hasColumn('comments', 'is_spoiler')) {
                $table->boolean('is_spoiler')->default(false)->after('image_url');
            }
            if (! Schema::hasColumn('comments', 'is_pinned')) {
                $table->boolean('is_pinned')->default(false)->after('is_spoiler');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('comments')) {
            return;
        }

        Schema::table('comments', function (Blueprint $table) {
            foreach (['is_pinned', 'is_spoiler', 'image_url', 'gif_url', 'reaction_emoji'] as $column) {
                if (Schema::hasColumn('comments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
