<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_suspended')->default(false)->after('is_banned');
            $table->text('suspension_reason')->nullable()->after('is_suspended');
            $table->timestamp('suspended_at')->nullable()->after('suspension_reason');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->string('source_type')->nullable()->after('status');
            $table->uuid('source_id')->nullable()->after('source_type');
            $table->index(['source_type', 'source_id']);
        });

        Schema::create('content_suspensions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
            $table->string('target_type');
            $table->uuid('target_id');
            $table->string('target_field')->nullable();
            $table->text('reason');
            $table->enum('status', ['active', 'restored'])->default('active');
            $table->timestamp('hidden_at')->nullable();
            $table->timestamp('restored_at')->nullable();
            $table->timestamps();

            $table->index(['target_type', 'target_id', 'target_field']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_suspensions');

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['source_type', 'source_id']);
            $table->dropColumn(['source_type', 'source_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_suspended', 'suspension_reason', 'suspended_at']);
        });
    }
};
