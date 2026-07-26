<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('commission_artist_profiles')) {
            return;
        }

        Schema::table('commission_artist_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('commission_artist_profiles', 'policies')) {
                $table->json('policies')->nullable()->after('terms_moderation_status');
            }
            if (! Schema::hasColumn('commission_artist_profiles', 'request_forms')) {
                $table->json('request_forms')->nullable()->after('policies');
            }
            if (! Schema::hasColumn('commission_artist_profiles', 'faqs')) {
                $table->json('faqs')->nullable()->after('request_forms');
            }
            if (! Schema::hasColumn('commission_artist_profiles', 'discounts')) {
                $table->json('discounts')->nullable()->after('faqs');
            }
            if (! Schema::hasColumn('commission_artist_profiles', 'client_fields')) {
                $table->json('client_fields')->nullable()->after('discounts');
            }
            if (! Schema::hasColumn('commission_artist_profiles', 'flow_template')) {
                $table->json('flow_template')->nullable()->after('client_fields');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('commission_artist_profiles')) {
            return;
        }

        Schema::table('commission_artist_profiles', function (Blueprint $table) {
            foreach (['flow_template', 'client_fields', 'discounts', 'faqs', 'request_forms', 'policies'] as $column) {
                if (Schema::hasColumn('commission_artist_profiles', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
