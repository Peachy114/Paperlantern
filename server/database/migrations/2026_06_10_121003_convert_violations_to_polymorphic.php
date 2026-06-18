<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('violations', function (Blueprint $table) {
            $table->dropForeign(['chapter_id']);
            $table->dropColumn('chapter_id');

            $table->string('target_type')->after('admin_id');
            $table->unsignedBigInteger('target_id')->after('target_type');
            $table->index(['target_type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::table('violations', function (Blueprint $table) {
            $table->dropIndex(['target_type', 'target_id']);
            $table->dropColumn(['target_type', 'target_id']);
            $table->foreignId('chapter_id')->constrained()->cascadeOnDelete();
        });
    }
};
