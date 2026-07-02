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
        Schema::table('users', function (Blueprint $table) {
            $table->string('twitter_url')->nullable()->after('username');
            $table->string('instagram_url')->nullable()->after('twitter_url');
            $table->string('tiktok_url')->nullable()->after('instagram_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['twitter_url', 'instagram_url', 'tiktok_url']);
        });
    }
};
