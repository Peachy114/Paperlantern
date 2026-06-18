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
        Schema::table('chapters', function (Blueprint $table) {
            $table->enum('lock_type', ['free', 'early_access', 'premium'])->default('free')->after('is_locked');
            $table->integer('unlock_after_days')->default(7)->after('lock_type');
            $table->timestamp('unlocks_at')->nullable()->after('unlock_after_days');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chapters', function (Blueprint $table) {
            $table->dropColumn(['lock_type', 'unlock_after_days', 'unlocks_at']);
        });
    }
};
