<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('arts', 'public_sort_order')) {
            Schema::table('arts', function (Blueprint $table) {
                $table->unsignedInteger('public_sort_order')->nullable()->after('super_like_credits');
                $table->index('public_sort_order');
            });
        }

        if (Schema::hasTable('feature_boosts')) {
            return;
        }

        Schema::create('feature_boosts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('target_type', 32);
            $table->uuid('target_id');
            $table->unsignedInteger('days');
            $table->unsignedInteger('credits_spent');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('status', 24)->default('active');
            $table->timestamps();

            $table->index(['target_type', 'target_id', 'status', 'ends_at']);
            $table->index(['user_id', 'status', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_boosts');

        if (Schema::hasColumn('arts', 'public_sort_order')) {
            Schema::table('arts', function (Blueprint $table) {
                $table->dropIndex(['public_sort_order']);
                $table->dropColumn('public_sort_order');
            });
        }
    }
};
