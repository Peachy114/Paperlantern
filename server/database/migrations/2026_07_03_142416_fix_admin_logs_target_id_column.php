<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE admin_logs MODIFY target_id VARCHAR(36) NULL');
    }

    public function down(): void
    {
        // Not cleanly reversible: existing UUID values in target_id won't fit back into bigint.
        throw new \RuntimeException('Not reversible without data loss — restore from backup if needed.');
    }
};