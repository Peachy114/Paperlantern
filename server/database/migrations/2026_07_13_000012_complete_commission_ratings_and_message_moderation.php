<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('commission_messages')) {
            Schema::table('commission_messages', function (Blueprint $table) {
                if (! Schema::hasColumn('commission_messages', 'image_moderation_status')) {
                    $table->enum('image_moderation_status', ['pending', 'approved', 'suspended'])
                        ->default('approved')
                        ->after('image_path');
                }
            });
        }

        if (Schema::hasTable('commission_ratings')) {
            Schema::table('commission_ratings', function (Blueprint $table) {
                if (! Schema::hasColumn('commission_ratings', 'appeal_reason')) {
                    $table->text('appeal_reason')->nullable()->after('status');
                }
                if (! Schema::hasColumn('commission_ratings', 'appealed_at')) {
                    $table->timestamp('appealed_at')->nullable()->after('appeal_reason');
                }
                if (! Schema::hasColumn('commission_ratings', 'reviewed_at')) {
                    $table->timestamp('reviewed_at')->nullable()->after('appealed_at');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('commission_ratings')) {
            Schema::table('commission_ratings', function (Blueprint $table) {
                foreach (['appeal_reason', 'appealed_at', 'reviewed_at'] as $column) {
                    if (Schema::hasColumn('commission_ratings', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('commission_messages') && Schema::hasColumn('commission_messages', 'image_moderation_status')) {
            Schema::table('commission_messages', function (Blueprint $table) {
                $table->dropColumn('image_moderation_status');
            });
        }
    }
};
