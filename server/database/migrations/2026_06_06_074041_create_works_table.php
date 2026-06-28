<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('works', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['webtoon', 'wattpad']);
            $table->json('genres');
            $table->string('cover')->nullable();
            $table->string('banner')->nullable();
            $table->enum('status', ['draft', 'ongoing', 'completed', 'hiatus'])->default('draft');
            $table->string('schedule')->nullable();
            $table->time('schedule_time')->nullable();
            $table->date('next_chapter_at')->nullable();
            $table->unsignedBigInteger('views')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('works');
    }
};