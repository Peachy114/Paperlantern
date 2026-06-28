<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chapter_views', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('chapter_id', 36);
            $table->foreign('chapter_id')->references('id')->on('chapters')->cascadeOnDelete();
            $table->string('user_id', 36)->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapter_views');
    }
};