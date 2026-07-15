<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('page_layouts')) {
            return;
        }

        Schema::create('page_layouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('page_key', 40)->unique();
            $table->json('widgets');
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_layouts');
    }
};
