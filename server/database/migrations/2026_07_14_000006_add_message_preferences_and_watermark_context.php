<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'message_read_receipts_enabled')) {
                    $table->boolean('message_read_receipts_enabled')->default(true)->after('account_menu_style');
                }
                if (! Schema::hasColumn('users', 'message_design_id')) {
                    $table->uuid('message_design_id')->nullable()->after('message_read_receipts_enabled');
                }
                if (! Schema::hasColumn('users', 'message_background_id')) {
                    $table->uuid('message_background_id')->nullable()->after('message_design_id');
                }
            });
        }

        if (Schema::hasTable('commission_orders')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                if (! Schema::hasColumn('commission_orders', 'artist_last_read_at')) {
                    $table->timestamp('artist_last_read_at')->nullable()->after('disputed_at');
                }
                if (! Schema::hasColumn('commission_orders', 'customer_last_read_at')) {
                    $table->timestamp('customer_last_read_at')->nullable()->after('artist_last_read_at');
                }
            });
        }

        if (Schema::hasTable('art_watermarks')) {
            Schema::table('art_watermarks', function (Blueprint $table) {
                if (! Schema::hasColumn('art_watermarks', 'target')) {
                    $table->string('target')->default('arts')->after('image_path');
                }
                if (! Schema::hasColumn('art_watermarks', 'rotation')) {
                    $table->smallInteger('rotation')->default(0)->after('opacity');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('art_watermarks')) {
            Schema::table('art_watermarks', function (Blueprint $table) {
                foreach (['target', 'rotation'] as $column) {
                    if (Schema::hasColumn('art_watermarks', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('commission_orders')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                foreach (['artist_last_read_at', 'customer_last_read_at'] as $column) {
                    if (Schema::hasColumn('commission_orders', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                foreach (['message_read_receipts_enabled', 'message_design_id', 'message_background_id'] as $column) {
                    if (Schema::hasColumn('users', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
