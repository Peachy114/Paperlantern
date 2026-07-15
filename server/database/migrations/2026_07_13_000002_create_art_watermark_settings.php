<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('art_watermarks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('image_path');
            $table->string('position')->default('bottom-right');
            $table->integer('offset_x')->default(24);
            $table->integer('offset_y')->default(24);
            $table->unsignedTinyInteger('width_percent')->default(18);
            $table->unsignedTinyInteger('opacity')->default(58);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('art_watermark_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('noise_enabled')->default(false);
            $table->unsignedTinyInteger('noise_opacity')->default(8);
            $table->unsignedTinyInteger('noise_density')->default(2);
            $table->timestamps();
        });

        DB::table('art_watermark_settings')->insert([
            'id' => 1,
            'noise_enabled' => false,
            'noise_opacity' => 8,
            'noise_density' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('art_watermark_settings');
        Schema::dropIfExists('art_watermarks');
    }
};
