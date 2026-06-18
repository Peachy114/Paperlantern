<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sticky_notes', function (Blueprint $table) {
            $table->string('moderation_status')
                  ->default('pending_review'); // adjust 'after' to match your actual column order
        });
    }

    public function down(): void
    {
        Schema::table('sticky_notes', function (Blueprint $table) {
            $table->dropColumn('moderation_status');
        });
    }
};