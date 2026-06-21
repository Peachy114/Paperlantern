<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Clean orphaned records first
        $tables = ['works', 'sticky_notes', 'violations'];
        foreach ($tables as $table) {
            DB::table($table)->whereNotIn('user_id', DB::table('users')->pluck('id'))->delete();
        }

        // Works
        Schema::table('works', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
 
        // Sticky Notes
        Schema::table('sticky_notes', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // Violations
        Schema::table('violations', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        $tables = ['works', 'chapters', 'sticky_notes', 'chapter_images', 'chapter_views', 'chapter_likes', 'violations'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
            });
        }
    }
};
