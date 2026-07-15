<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('arts', 'apply_watermark')) {
            Schema::table('arts', function (Blueprint $table) {
                $table->boolean('apply_watermark')->default(true)->after('downloads_count');
            });
        }

        if (! Schema::hasTable('art_views')) {
            Schema::create('art_views', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('art_id')->constrained('arts')->cascadeOnDelete();
                $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('viewer_key', 80);
                $table->date('viewed_on');
                $table->timestamps();

                $table->unique(['art_id', 'viewer_key', 'viewed_on']);
                $table->index(['art_id', 'viewed_on']);
                $table->index('user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('art_views');

        if (Schema::hasColumn('arts', 'apply_watermark')) {
            Schema::table('arts', function (Blueprint $table) {
                $table->dropColumn('apply_watermark');
            });
        }
    }
};
