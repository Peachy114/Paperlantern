<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('works', function (Blueprint $table) {
            if (! Schema::hasColumn('works', 'content_rating_assessment')) {
                $table->json('content_rating_assessment')->nullable()->after('genres');
            }
        });

        Schema::table('chapters', function (Blueprint $table) {
            if (! Schema::hasColumn('chapters', 'artist_note')) {
                $table->text('artist_note')->nullable()->after('content');
            }
        });
    }

    public function down(): void
    {
        Schema::table('works', function (Blueprint $table) {
            if (Schema::hasColumn('works', 'content_rating_assessment')) {
                $table->dropColumn('content_rating_assessment');
            }
        });

        Schema::table('chapters', function (Blueprint $table) {
            if (Schema::hasColumn('chapters', 'artist_note')) {
                $table->dropColumn('artist_note');
            }
        });
    }
};
