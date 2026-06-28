<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
    Schema::create('chapter_images', function (Blueprint $table) {
        $table->string('id', 36)->primary();
        $table->string('chapter_id', 36);
        $table->foreign('chapter_id')->references('id')->on('chapters')->cascadeOnDelete();
        $table->string('path');
        $table->integer('order')->default(0);
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chapter_images');
    }
};
