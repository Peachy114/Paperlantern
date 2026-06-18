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
        Schema::create('works', function (Blueprint $table) {
             $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('title');
        $table->text('description')->nullable();
        $table->enum('type', ['webtoon', 'wattpad']);

        // Genre — at least 1 required, store as JSON for multiple
        $table->json('genres');

        // Media
        $table->string('cover')->nullable();
        $table->string('banner')->nullable();

        // Status
        $table->enum('status', ['draft', 'ongoing', 'completed', 'hiatus'])->default('draft');

        // Chapter schedule — e.g. "Every Monday", "Every Friday"
        $table->string('schedule')->nullable();         // e.g. "Monday"
        $table->time('schedule_time')->nullable();      // e.g. "12:00:00"
        $table->date('next_chapter_at')->nullable();    // next expected chapter date

        // Stats
        $table->unsignedBigInteger('views')->default(0);

        $table->timestamps();
        $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('works');
    }
};
