<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('commission_orders')) {
            return;
        }

        Schema::table('commission_orders', function (Blueprint $table) {
            if (! Schema::hasColumn('commission_orders', 'quote_note')) {
                $table->text('quote_note')->nullable()->after('quote_credits');
            }
            if (! Schema::hasColumn('commission_orders', 'quote_accepted_at')) {
                $table->timestamp('quote_accepted_at')->nullable()->after('accepted_at');
            }
            if (! Schema::hasColumn('commission_orders', 'paid_steps')) {
                $table->json('paid_steps')->nullable()->after('flow_snapshot');
            }
            if (! Schema::hasColumn('commission_orders', 'stage_notes')) {
                $table->json('stage_notes')->nullable()->after('paid_steps');
            }
            if (! Schema::hasColumn('commission_orders', 'payment_due_at')) {
                $table->timestamp('payment_due_at')->nullable()->after('auto_release_at');
            }
            if (! Schema::hasColumn('commission_orders', 'auto_pay_agreed')) {
                $table->boolean('auto_pay_agreed')->default(false)->after('payment_due_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('commission_orders')) {
            return;
        }

        Schema::table('commission_orders', function (Blueprint $table) {
            foreach ([
                'quote_note',
                'quote_accepted_at',
                'paid_steps',
                'stage_notes',
                'payment_due_at',
                'auto_pay_agreed',
            ] as $column) {
                if (Schema::hasColumn('commission_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
