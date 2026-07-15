<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artist_stickers', function (Blueprint $table) {
            if (! Schema::hasColumn('artist_stickers', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
        });

        Schema::table('profile_borders', function (Blueprint $table) {
            if (! Schema::hasColumn('profile_borders', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('artist_stickers', function (Blueprint $table) {
            if (Schema::hasColumn('artist_stickers', 'description')) {
                $table->dropColumn('description');
            }
        });

        Schema::table('profile_borders', function (Blueprint $table) {
            if (Schema::hasColumn('profile_borders', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
