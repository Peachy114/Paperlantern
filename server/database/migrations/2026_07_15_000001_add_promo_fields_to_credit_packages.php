<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_packages', function (Blueprint $table) {
            $table->string('promo_label')->nullable()->after('price');
            $table->timestamp('promo_start_at')->nullable()->after('promo_label');
            $table->timestamp('promo_end_at')->nullable()->after('promo_start_at');
        });
    }

    public function down(): void
    {
        Schema::table('credit_packages', function (Blueprint $table) {
            $table->dropColumn(['promo_label', 'promo_start_at', 'promo_end_at']);
        });
    }
};
