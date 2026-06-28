<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('created_by', 36);
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('content');
            $table->string('tag');
            $table->string('audience');
            $table->string('image')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};