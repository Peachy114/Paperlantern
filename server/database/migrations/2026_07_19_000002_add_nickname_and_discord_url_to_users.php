<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'nickname')) {
                $table->string('nickname')->nullable()->after('name');
            }

            if (! Schema::hasColumn('users', 'discord_url')) {
                $table->string('discord_url')->nullable()->after('twitter_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'discord_url')) {
                $table->dropColumn('discord_url');
            }

            if (Schema::hasColumn('users', 'nickname')) {
                $table->dropColumn('nickname');
            }
        });
    }
};
