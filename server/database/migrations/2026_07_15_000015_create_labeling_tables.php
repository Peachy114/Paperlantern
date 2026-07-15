<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('content_labels')) {
            Schema::create('content_labels', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->enum('type', ['genre', 'label']);
                $table->string('name');
                $table->string('slug');
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['type', 'slug']);
                $table->index(['type', 'is_active', 'sort_order']);
            });
        }

        if (! Schema::hasTable('label_requests')) {
            Schema::create('label_requests', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
                $table->enum('type', ['genre', 'label'])->default('genre');
                $table->string('name');
                $table->text('reason')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();

                $table->index(['type', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('label_requests');
        Schema::dropIfExists('content_labels');
    }
};
