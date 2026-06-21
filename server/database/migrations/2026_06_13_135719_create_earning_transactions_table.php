<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
     {
        Schema::create('earning_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('storyteller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reader_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('chapter_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('credits_spent');        //total credits reader paid
            $table->unsignedInteger('platform_cut');         //20% to laterncomix
            $table->unsignedInteger('storyteller_cut');      //80% to storyteller
            $table->decimal('platform_php', 8, 2);         // PHP equivalent
            $table->decimal('storyteller_php', 8, 2);      // PHP equivalent
            $table->decimal('credit_to_php_rate', 8, 4);    //rate at time of transaction
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('earning_transactions');
    }
};
