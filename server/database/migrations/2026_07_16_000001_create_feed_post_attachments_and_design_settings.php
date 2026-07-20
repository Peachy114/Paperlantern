<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('feed_post_attachments')) {
            Schema::create('feed_post_attachments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('feed_post_id')->constrained('feed_posts')->cascadeOnDelete();
                $table->string('attachable_type');
                $table->uuid('attachable_id');
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['feed_post_id', 'sort_order']);
                $table->index(['attachable_type', 'attachable_id']);
            });
        }

        if (Schema::hasTable('royalty_design_assets') && ! Schema::hasColumn('royalty_design_assets', 'style_settings')) {
            Schema::table('royalty_design_assets', function (Blueprint $table) {
                $table->json('style_settings')->nullable()->after('image_path');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('royalty_design_assets') && Schema::hasColumn('royalty_design_assets', 'style_settings')) {
            Schema::table('royalty_design_assets', function (Blueprint $table) {
                $table->dropColumn('style_settings');
            });
        }

        Schema::dropIfExists('feed_post_attachments');
    }
};
