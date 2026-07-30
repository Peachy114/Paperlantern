<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'super_admin')
            ->whereNull('email_verified_at')
            ->update([
                'email_verified_at' => now(),
                'email_verification_code' => null,
                'email_verification_expires_at' => null,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Admin verification is intentionally not reverted.
    }
};
