<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('commission_delivery_files')) {
            return;
        }

        Schema::table('commission_delivery_files', function (Blueprint $table) {
            if (! Schema::hasColumn('commission_delivery_files', 'preview_path')) {
                $table->string('preview_path')->nullable()->after('file_path');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('commission_delivery_files') || ! Schema::hasColumn('commission_delivery_files', 'preview_path')) {
            return;
        }

        Schema::table('commission_delivery_files', function (Blueprint $table) {
            $table->dropColumn('preview_path');
        });
    }
};
