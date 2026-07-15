<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('commission_artist_profiles') && ! Schema::hasColumn('commission_artist_profiles', 'application_reason')) {
            Schema::table('commission_artist_profiles', function (Blueprint $table) {
                $table->text('application_reason')->nullable()->after('commission_status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('commission_artist_profiles') && Schema::hasColumn('commission_artist_profiles', 'application_reason')) {
            Schema::table('commission_artist_profiles', function (Blueprint $table) {
                $table->dropColumn('application_reason');
            });
        }
    }
};
