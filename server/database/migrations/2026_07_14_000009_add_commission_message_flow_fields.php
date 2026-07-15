<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('commission_messages')) {
            return;
        }

        Schema::table('commission_messages', function (Blueprint $table) {
            if (! Schema::hasColumn('commission_messages', 'kind')) {
                $table->string('kind')->default('message')->after('body');
            }
            if (! Schema::hasColumn('commission_messages', 'upload_type')) {
                $table->string('upload_type')->nullable()->after('kind');
            }
            if (! Schema::hasColumn('commission_messages', 'stage_index')) {
                $table->unsignedInteger('stage_index')->nullable()->after('upload_type');
            }
            if (! Schema::hasColumn('commission_messages', 'approval_status')) {
                $table->string('approval_status')->nullable()->after('stage_index');
            }
            if (! Schema::hasColumn('commission_messages', 'delivery_file_id')) {
                $table->uuid('delivery_file_id')->nullable()->after('approval_status');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('commission_messages')) {
            return;
        }

        Schema::table('commission_messages', function (Blueprint $table) {
            foreach (['kind', 'upload_type', 'stage_index', 'approval_status', 'delivery_file_id'] as $column) {
                if (Schema::hasColumn('commission_messages', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
