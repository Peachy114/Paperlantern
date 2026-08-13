<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_moderation_status', 20)->default('approved')->after('avatar');
            $table->string('cover_moderation_status', 20)->default('approved')->after('profile_cover');
            $table->timestamp('avatar_uploaded_at')->nullable()->after('avatar_moderation_status');
            $table->timestamp('cover_uploaded_at')->nullable()->after('cover_moderation_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar_moderation_status', 'cover_moderation_status',
                'avatar_uploaded_at', 'cover_uploaded_at',
            ]);
        });
    }
};
