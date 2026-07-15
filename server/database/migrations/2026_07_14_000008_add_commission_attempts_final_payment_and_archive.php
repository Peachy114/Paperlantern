<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('commission_orders')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                if (! Schema::hasColumn('commission_orders', 'stage_attempts_used')) {
                    $table->json('stage_attempts_used')->nullable()->after('stage_notes');
                }
                if (! Schema::hasColumn('commission_orders', 'final_payment_paid_at')) {
                    $table->timestamp('final_payment_paid_at')->nullable()->after('payment_due_at');
                }
                if (! Schema::hasColumn('commission_orders', 'archived_at')) {
                    $table->timestamp('archived_at')->nullable()->after('completed_at');
                }
            });
        }

        if (Schema::hasTable('commission_revisions')) {
            Schema::table('commission_revisions', function (Blueprint $table) {
                if (! Schema::hasColumn('commission_revisions', 'requested_step_index')) {
                    $table->unsignedInteger('requested_step_index')->nullable()->after('revision_number');
                }
                if (! Schema::hasColumn('commission_revisions', 'requested_step_type')) {
                    $table->string('requested_step_type')->nullable()->after('requested_step_index');
                }
                if (! Schema::hasColumn('commission_revisions', 'extra_attempt_credits')) {
                    $table->unsignedInteger('extra_attempt_credits')->default(0)->after('requested_step_type');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('commission_revisions')) {
            Schema::table('commission_revisions', function (Blueprint $table) {
                foreach (['requested_step_index', 'requested_step_type', 'extra_attempt_credits'] as $column) {
                    if (Schema::hasColumn('commission_revisions', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('commission_orders')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                foreach (['stage_attempts_used', 'final_payment_paid_at', 'archived_at'] as $column) {
                    if (Schema::hasColumn('commission_orders', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
