<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('art_download_files')) {
            Schema::create('art_download_files', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('art_id')->constrained('arts')->cascadeOnDelete();
                $table->string('file_path');
                $table->string('original_name')->nullable();
                $table->string('mime_type')->nullable();
                $table->unsignedBigInteger('size_bytes')->default(0);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['art_id', 'sort_order']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('art_download_files');
    }
};
