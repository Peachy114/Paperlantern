<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    Schema::create('chapter_likes', function (Blueprint $table) {
        $table->string('id', 36)->primary();
        $table->string('chapter_id', 36);
        $table->foreign('chapter_id')->references('id')->on('chapters')->cascadeOnDelete();
        $table->string('user_id', 36);
        $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        $table->timestamps();
        $table->unique(['chapter_id', 'user_id']);
    });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapter_likes');
    }
};