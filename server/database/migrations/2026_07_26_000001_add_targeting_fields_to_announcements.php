<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->json('page_targets')->nullable()->after('audience');
            $table->string('placement')->default('banner')->after('page_targets');
            $table->boolean('is_public')->default(true)->after('placement');
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['page_targets', 'placement', 'is_public']);
        });
    }
};
