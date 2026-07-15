<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('commission_revisions')) {
            Schema::create('commission_revisions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('commission_order_id')->constrained('commission_orders')->cascadeOnDelete();
                $table->foreignUuid('requested_by')->constrained('users')->cascadeOnDelete();
                $table->text('reason');
                $table->unsignedInteger('revision_number')->default(1);
                $table->enum('status', ['requested', 'in_progress', 'resolved', 'rejected'])->default('requested');
                $table->text('artist_response')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();

                $table->index(['commission_order_id', 'status'], 'commission_revisions_order_status_idx');
            });
        }

        if (! Schema::hasTable('commission_delivery_files')) {
            Schema::create('commission_delivery_files', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('commission_order_id')->constrained('commission_orders')->cascadeOnDelete();
                $table->foreignUuid('uploaded_by')->constrained('users')->cascadeOnDelete();
                $table->string('file_path');
                $table->string('original_name')->nullable();
                $table->string('mime_type')->nullable();
                $table->unsignedBigInteger('size_bytes')->default(0);
                $table->text('note')->nullable();
                $table->enum('moderation_status', ['pending', 'approved', 'suspended'])->default('pending');
                $table->timestamps();

                $table->index(['commission_order_id', 'moderation_status'], 'commission_delivery_order_status_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_delivery_files');
        Schema::dropIfExists('commission_revisions');
    }
};
