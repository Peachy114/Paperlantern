<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('commission_services')) {
            Schema::table('commission_services', function (Blueprint $table) {
                if (! Schema::hasColumn('commission_services', 'request_questions')) {
                    $table->json('request_questions')->nullable()->after('required_references');
                }
                if (! Schema::hasColumn('commission_services', 'info_questions')) {
                    $table->json('info_questions')->nullable()->after('request_questions');
                }
                if (! Schema::hasColumn('commission_services', 'client_fields')) {
                    $table->json('client_fields')->nullable()->after('info_questions');
                }
                if (! Schema::hasColumn('commission_services', 'promo_discounts')) {
                    $table->json('promo_discounts')->nullable()->after('client_fields');
                }
                if (! Schema::hasColumn('commission_services', 'setup_options')) {
                    $table->json('setup_options')->nullable()->after('promo_discounts');
                }
            });
        }

        if (Schema::hasTable('commission_orders')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                if (! Schema::hasColumn('commission_orders', 'request_answers')) {
                    $table->json('request_answers')->nullable()->after('reference_notes');
                }
                if (! Schema::hasColumn('commission_orders', 'client_details')) {
                    $table->json('client_details')->nullable()->after('request_answers');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('commission_orders')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                foreach (['request_answers', 'client_details'] as $column) {
                    if (Schema::hasColumn('commission_orders', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('commission_services')) {
            Schema::table('commission_services', function (Blueprint $table) {
                foreach (['request_questions', 'info_questions', 'client_fields', 'promo_discounts', 'setup_options'] as $column) {
                    if (Schema::hasColumn('commission_services', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
