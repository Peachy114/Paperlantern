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
            $table->string('status')->default('draft')->after('order'); // draft, scheduled, published
            $table->string('cover')->nullable()->after('status');
            $table->timestamp('scheduled_at')->nullable()->after('cover');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chapters', function (Blueprint $table) {
            $table->dropColumn(['status', 'cover', 'scheduled_at']);
        });
    }
};
