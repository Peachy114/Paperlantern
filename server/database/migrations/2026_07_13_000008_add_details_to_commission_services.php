<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('commission_services')) {
            return;
        }

        Schema::table('commission_services', function (Blueprint $table) {
            if (! Schema::hasColumn('commission_services', 'quote_rules')) {
                $table->text('quote_rules')->nullable()->after('terms');
            }
            if (! Schema::hasColumn('commission_services', 'refund_policy')) {
                $table->text('refund_policy')->nullable()->after('quote_rules');
            }
            if (! Schema::hasColumn('commission_services', 'required_references')) {
                $table->text('required_references')->nullable()->after('refund_policy');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('commission_services')) {
            return;
        }

        Schema::table('commission_services', function (Blueprint $table) {
            foreach (['quote_rules', 'refund_policy', 'required_references'] as $column) {
                if (Schema::hasColumn('commission_services', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
