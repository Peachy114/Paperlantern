<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    Schema::create('withdrawal_requests', function (Blueprint $table) {
        $table->string('id', 36)->primary();
        $table->string('user_id', 36);
        $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        $table->decimal('amount_php', 10, 2);
        $table->unsignedInteger('credits_redeemed');
        $table->enum('status', ['pending', 'approved', 'rejected', 'paid'])->default('pending');
        $table->enum('payout_method', ['gcash', 'maya', 'bank']);
        $table->string('payout_details');
        $table->text('admin_notes')->nullable();
        $table->timestamp('processed_at')->nullable();
        $table->timestamps();
    });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
    }
};