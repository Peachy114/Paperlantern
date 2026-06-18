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
         Schema::create('storyteller_earnings', function (Blueprint $table) {
             $table->id();
             $table->foreignId('user_id')->constrained()->cascadeOnDelete();  //storyteller
             $table->unsignedInteger('balance')->default(0);          //in credits
             $table->decimal('php_balance', 10, 2)->default(0);       //converted PHP
             $table->timestamps();
             $table->unique('user_id');
         });
     }

    public function down(): void
    {
        Schema::dropIfExists('storyteller_earnings');
    }
};
