<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('commission_orders')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                if (! Schema::hasColumn('commission_orders', 'refunded_credits')) {
                    $table->unsignedInteger('refunded_credits')->default(0)->after('released_credits');
                }
            });
        }

        if (! Schema::hasTable('commission_messages')) {
            Schema::create('commission_messages', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('commission_order_id')->constrained('commission_orders')->cascadeOnDelete();
                $table->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();
                $table->text('body')->nullable();
                $table->string('image_path')->nullable();
                $table->timestamps();

                $table->index(['commission_order_id', 'created_at']);
                $table->index('sender_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_messages');

        if (Schema::hasTable('commission_orders') && Schema::hasColumn('commission_orders', 'refunded_credits')) {
            Schema::table('commission_orders', function (Blueprint $table) {
                $table->dropColumn('refunded_credits');
            });
        }
    }
};
