<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('works') || Schema::hasColumn('works', 'language')) {
            return;
        }

        Schema::table('works', function (Blueprint $table) {
            $table->string('language', 8)->default('en')->after('genres');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('works') || ! Schema::hasColumn('works', 'language')) {
            return;
        }

        Schema::table('works', function (Blueprint $table) {
            $table->dropColumn('language');
        });
    }
};
