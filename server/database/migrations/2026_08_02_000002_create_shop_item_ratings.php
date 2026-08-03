<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shop_item_ratings')) {
            Schema::create('shop_item_ratings', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('shop_item_id')->constrained('shop_items')->cascadeOnDelete();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->unsignedTinyInteger('rating');
                $table->text('comment')->nullable();
                $table->timestamps();

                $table->unique(['shop_item_id', 'user_id']);
                $table->index(['shop_item_id', 'rating']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_item_ratings');
    }
};
