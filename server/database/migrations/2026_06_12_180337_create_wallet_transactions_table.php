<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    Schema::create('wallet_transactions', function (Blueprint $table) {
        $table->string('id', 36)->primary();
        $table->string('wallet_id', 36);
        $table->foreign('wallet_id')->references('id')->on('wallets')->cascadeOnDelete();
        $table->string('user_id', 36);
        $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        $table->enum('type', ['credit', 'debit']);
        $table->enum('source', ['purchase', 'chapter_unlock', 'refund', 'bonus']);
        $table->unsignedInteger('amount');
        $table->unsignedInteger('balance_before');
        $table->unsignedInteger('balance_after');
        $table->string('description')->nullable();
        $table->json('meta')->nullable();
        $table->string('reference_id')->nullable()->unique();
        $table->timestamps();
        $table->index('user_id');
        $table->index('reference_id');
    });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};