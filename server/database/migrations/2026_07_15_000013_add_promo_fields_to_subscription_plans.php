<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('subscription_plans', 'promo_label')) {
                $table->string('promo_label')->nullable()->after('monthly_credit_cost');
            }
            if (! Schema::hasColumn('subscription_plans', 'promo_credit_cost')) {
                $table->unsignedInteger('promo_credit_cost')->nullable()->after('promo_label');
            }
            if (! Schema::hasColumn('subscription_plans', 'promo_start_at')) {
                $table->timestamp('promo_start_at')->nullable()->after('promo_credit_cost');
            }
            if (! Schema::hasColumn('subscription_plans', 'promo_end_at')) {
                $table->timestamp('promo_end_at')->nullable()->after('promo_start_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            foreach (['promo_end_at', 'promo_start_at', 'promo_credit_cost', 'promo_label'] as $column) {
                if (Schema::hasColumn('subscription_plans', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
