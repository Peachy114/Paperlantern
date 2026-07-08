<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('earning_snapshots', function (Blueprint $table) {
            $table->id();
            
            // UUID foreign keys (SQLite-compatible)
            $table->string('storyteller_id', 36);
            $table->foreign('storyteller_id')->references('id')->on('users')->cascadeOnDelete();
            
            // Denormalized — stored as text so deleting work/chapter won't lose history
            $table->string('work_title');
            $table->string('chapter_title');
            $table->string('chapter_id', 36)->nullable(); // nullable, just for reference
            
            // Earnings breakdown
            $table->integer('credits_spent');
            $table->integer('platform_cut');
            $table->integer('storyteller_cut');
            $table->decimal('platform_php', 10, 2);
            $table->decimal('storyteller_php', 10, 2);
            $table->decimal('credit_to_php_rate', 8, 4);
            
            $table->timestamp('earned_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('earning_snapshots');
    }
};