<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus', 'art_download') NOT NULL"
        );
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus') NOT NULL"
        );
    }
};
