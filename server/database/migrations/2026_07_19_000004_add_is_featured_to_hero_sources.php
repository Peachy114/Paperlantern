<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['works', 'arts', 'announcements', 'commission_services'] as $tableName) {
            if (Schema::hasTable($tableName) && ! Schema::hasColumn($tableName, 'is_featured')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->boolean('is_featured')->default(false)->index();
                });
            }
        }
    }

    public function down(): void
    {
        foreach (['works', 'arts', 'announcements', 'commission_services'] as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'is_featured')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('is_featured');
                });
            }
        }
    }
};
