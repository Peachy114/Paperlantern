<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            if (! Schema::hasColumn('comments', 'public_highlight')) {
                $table->boolean('public_highlight')->default(false)->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            if (Schema::hasColumn('comments', 'public_highlight')) {
                $table->dropColumn('public_highlight');
            }
        });
    }
};
