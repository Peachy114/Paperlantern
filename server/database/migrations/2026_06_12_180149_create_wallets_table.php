<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    Schema::create('wallets', function (Blueprint $table) {
        $table->string('id', 36)->primary();
        $table->string('user_id', 36);
        $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        $table->unsignedInteger('balance')->default(0);
        $table->timestamps();
        $table->unique('user_id');
    });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};