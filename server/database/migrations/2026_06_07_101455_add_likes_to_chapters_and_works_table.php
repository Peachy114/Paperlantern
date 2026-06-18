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
        Schema::table('chapters', function (Blueprint $table) {
            $table->unsignedBigInteger('likes')->default(0);
        });
        Schema::table('works', function (Blueprint $table) {
            $table->unsignedBigInteger('likes')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chapters_and_works', function (Blueprint $table) {
            //
        });
    }
};
