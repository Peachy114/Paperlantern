<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('format', 16)->default('short')->after('content');
            $table->text('excerpt')->nullable()->after('format');
            $table->longText('body_html')->nullable()->after('excerpt');
            $table->json('gallery_images')->nullable()->after('image');
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['format', 'excerpt', 'body_html', 'gallery_images']);
        });
    }
};
