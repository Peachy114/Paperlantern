<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artist_profile_blocks', function (Blueprint $table) {
            $table->decimal('rotation', 6, 2)->default(0)->after('z_index');
        });
    }

    public function down(): void
    {
        Schema::table('artist_profile_blocks', function (Blueprint $table) {
            $table->dropColumn('rotation');
        });
    }
};
