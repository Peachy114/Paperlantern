<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('creator_role', 20)->nullable()->after('role');
            $table->json('creator_features')->nullable()->after('creator_role');
        });

        DB::table('users')->where('role', 'storyteller')->update([
            'creator_role' => 'storyteller',
            // Existing creators previously had every studio feature; do not silently
            // remove access during deployment.
            'creator_features' => json_encode(['webcomix', 'novels', 'arts', 'commission', 'shop']),
        ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['creator_role', 'creator_features']);
        });
    }
};
