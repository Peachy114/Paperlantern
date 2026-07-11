<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('arts', function (Blueprint $table) {
            $table->json('labels')->nullable()->after('description');
        });

        Schema::create('art_images', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('art_id')->constrained('arts')->cascadeOnDelete();
            $table->string('image_path');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['art_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('art_images');

        Schema::table('arts', function (Blueprint $table) {
            $table->dropColumn('labels');
        });
    }
};
