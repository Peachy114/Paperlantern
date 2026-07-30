<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement(
            "ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus', 'art_download') NOT NULL"
        );
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement(
            "ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus') NOT NULL"
        );
    }
};
