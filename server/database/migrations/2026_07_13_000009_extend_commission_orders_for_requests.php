<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus', 'art_download', 'commission_escrow', 'commission_release', 'commission_refund') NOT NULL"
        );

        if (Schema::hasTable('commission_orders')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                if (! Schema::hasColumn('commission_orders', 'request_message')) {
                    $table->text('request_message')->nullable()->after('status');
                }
                if (! Schema::hasColumn('commission_orders', 'reference_notes')) {
                    $table->text('reference_notes')->nullable()->after('request_message');
                }
                if (! Schema::hasColumn('commission_orders', 'credits_checked')) {
                    $table->unsignedInteger('credits_checked')->default(0)->after('quote_credits');
                }
                if (! Schema::hasColumn('commission_orders', 'escrow_credits')) {
                    $table->unsignedInteger('escrow_credits')->default(0)->after('credits_checked');
                }
                if (! Schema::hasColumn('commission_orders', 'released_credits')) {
                    $table->unsignedInteger('released_credits')->default(0)->after('escrow_credits');
                }
                if (! Schema::hasColumn('commission_orders', 'current_step_index')) {
                    $table->unsignedInteger('current_step_index')->default(0)->after('flow_snapshot');
                }
                if (! Schema::hasColumn('commission_orders', 'accepted_at')) {
                    $table->timestamp('accepted_at')->nullable()->after('auto_release_at');
                }
                if (! Schema::hasColumn('commission_orders', 'delivered_at')) {
                    $table->timestamp('delivered_at')->nullable()->after('accepted_at');
                }
                if (! Schema::hasColumn('commission_orders', 'completed_at')) {
                    $table->timestamp('completed_at')->nullable()->after('delivered_at');
                }
                if (! Schema::hasColumn('commission_orders', 'cancelled_at')) {
                    $table->timestamp('cancelled_at')->nullable()->after('completed_at');
                }
                if (! Schema::hasColumn('commission_orders', 'disputed_at')) {
                    $table->timestamp('disputed_at')->nullable()->after('cancelled_at');
                }
            });
        }
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus', 'art_download') NOT NULL"
        );

        if (Schema::hasTable('commission_orders')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                foreach ([
                    'request_message',
                    'reference_notes',
                    'credits_checked',
                    'escrow_credits',
                    'released_credits',
                    'current_step_index',
                    'accepted_at',
                    'delivered_at',
                    'completed_at',
                    'cancelled_at',
                    'disputed_at',
                ] as $column) {
                    if (Schema::hasColumn('commission_orders', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
