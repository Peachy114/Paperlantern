<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sticky_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['text', 'image']);
            $table->string('text', 80)->nullable();
            $table->string('color', 20)->nullable();
            $table->string('image_path')->nullable();
            $table->string('rotate', 10)->default('0deg');
            $table->float('x')->default(220);
            $table->float('y')->default(20);
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('sticky_notes');
    }
};
