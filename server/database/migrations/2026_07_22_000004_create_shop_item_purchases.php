<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shop_item_purchases')) {
            Schema::create('shop_item_purchases', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('shop_item_id')->constrained('shop_items')->cascadeOnDelete();
                $table->unsignedInteger('credit_cost')->default(0);
                $table->timestamps();

                $table->unique(['user_id', 'shop_item_id']);
            });
        }

        DB::statement("ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus', 'art_download', 'commission_escrow', 'commission_release', 'commission_refund', 'noble_publish', 'subscription_purchase', 'shop_download') NOT NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_item_purchases');

        DB::statement("ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus', 'art_download', 'commission_escrow', 'commission_release', 'commission_refund', 'noble_publish', 'subscription_purchase') NOT NULL");
    }
};
