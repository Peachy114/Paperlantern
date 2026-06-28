<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chapters', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('work_id', 36);
            $table->foreign('work_id')->references('id')->on('works')->cascadeOnDelete();
            $table->string('title');
            $table->longText('content')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_locked')->default(false);
            $table->integer('credits_required')->default(0);
            $table->integer('views')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapters');
    }
};