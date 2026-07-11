<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('credit_payment_sessions')) {
            return;
        }

        Schema::create('credit_payment_sessions', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('user_id', 36);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unsignedBigInteger('credit_package_id');
            $table->foreign('credit_package_id')->references('id')->on('credit_packages')->cascadeOnDelete();
            $table->string('provider')->default('paymongo');
            $table->string('provider_mode')->default('test');
            $table->string('reference_id')->nullable()->unique();
            $table->text('checkout_url')->nullable();
            $table->string('status')->default('pending');
            $table->string('currency', 3)->default('PHP');
            $table->decimal('amount', 10, 2);
            $table->unsignedInteger('credits');
            $table->string('description')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_payment_sessions');
    }
};
