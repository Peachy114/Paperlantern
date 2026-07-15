<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artist_stickers', function (Blueprint $table) {
            if (! Schema::hasColumn('artist_stickers', 'bundle_name')) {
                $table->string('bundle_name')->nullable()->after('description');
            }

            if (! Schema::hasColumn('artist_stickers', 'is_free')) {
                $table->boolean('is_free')->default(false)->after('bundle_name');
            }

            if (! Schema::hasColumn('artist_stickers', 'credit_cost')) {
                $table->unsignedInteger('credit_cost')->default(1)->after('is_free');
            }
        });
    }

    public function down(): void
    {
        Schema::table('artist_stickers', function (Blueprint $table) {
            foreach (['bundle_name', 'is_free', 'credit_cost'] as $column) {
                if (Schema::hasColumn('artist_stickers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
