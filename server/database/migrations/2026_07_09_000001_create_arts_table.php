<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('arts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('image_path');
            $table->enum('status', ['draft', 'published', 'archived'])->default('published');
            $table->enum('moderation_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('views')->default(0);
            $table->unsignedBigInteger('likes')->default(0);
            $table->unsignedBigInteger('comments_count')->default(0);
            $table->unsignedBigInteger('super_likes_count')->default(0);
            $table->unsignedBigInteger('super_like_credits')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'slug']);
            $table->index(['user_id', 'status']);
            $table->index(['views', 'likes']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arts');
    }
};
