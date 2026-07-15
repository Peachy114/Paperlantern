<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('arts', function (Blueprint $table) {
            $table->string('original_image_path')->nullable()->after('image_path');
            $table->string('download_policy')->default('disabled')->after('moderation_status');
            $table->unsignedInteger('download_credits')->default(0)->after('download_policy');
            $table->unsignedBigInteger('downloads_count')->default(0)->after('download_credits');
        });

        Schema::table('art_images', function (Blueprint $table) {
            $table->string('original_image_path')->nullable()->after('image_path');
        });

        Schema::create('art_downloads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('art_id')->constrained('arts')->cascadeOnDelete();
            $table->unsignedInteger('credit_cost')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'art_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('art_downloads');

        Schema::table('art_images', function (Blueprint $table) {
            $table->dropColumn('original_image_path');
        });

        Schema::table('arts', function (Blueprint $table) {
            $table->dropColumn([
                'original_image_path',
                'download_policy',
                'download_credits',
                'downloads_count',
            ]);
        });
    }
};
