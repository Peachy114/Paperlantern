<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    Schema::create('earning_transactions', function (Blueprint $table) {
        $table->string('id', 36)->primary();
        $table->string('storyteller_id', 36);
        $table->foreign('storyteller_id')->references('id')->on('users')->cascadeOnDelete();
        $table->string('reader_id', 36);
        $table->foreign('reader_id')->references('id')->on('users')->cascadeOnDelete();
        $table->string('chapter_id', 36);
        $table->foreign('chapter_id')->references('id')->on('chapters')->cascadeOnDelete();
        $table->unsignedInteger('credits_spent');
        $table->unsignedInteger('platform_cut');
        $table->unsignedInteger('storyteller_cut');
        $table->decimal('platform_php', 8, 2);
        $table->decimal('storyteller_php', 8, 2);
        $table->decimal('credit_to_php_rate', 8, 4);
        $table->timestamps();
    });
    }

    public function down(): void
    {
        Schema::dropIfExists('earning_transactions');
    }
};