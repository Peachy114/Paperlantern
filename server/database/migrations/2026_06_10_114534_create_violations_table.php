<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('violations', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('user_id', 36);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('chapter_id', 36);
            $table->foreign('chapter_id')->references('id')->on('chapters')->cascadeOnDelete();
            $table->string('admin_id', 36);
            $table->foreign('admin_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('reason');
            $table->integer('strike_number');
            $table->boolean('resulted_in_ban')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('violations');
    }
};