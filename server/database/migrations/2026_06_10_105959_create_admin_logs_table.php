<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_logs', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('admin_id', 36);
            $table->foreign('admin_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('action');
            $table->string('target_type');
            $table->string('target_id', 36);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_logs');
    }
};