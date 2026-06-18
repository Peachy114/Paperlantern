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
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount_php', 10, 2);
            $table->unsignedInteger('credits_redeemed');
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid'])->default('pending');
            $table->enum('payout_method', ['gcash', 'maya', 'bank']);
            $table->string('payout_details');               // GCash number, bank account, etc.
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
