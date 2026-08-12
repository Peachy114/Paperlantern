<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            ! Schema::hasTable('artist_stickers')
            || ! Schema::hasTable('users')
            || ! Schema::hasColumn('artist_stickers', 'user_id')
        ) {
            return;
        }

        $superAdminIds = DB::table('users')
            ->where('role', 'super_admin')
            ->pluck('id');

        if ($superAdminIds->isEmpty()) {
            return;
        }

        $updates = [];

        if (Schema::hasColumn('artist_stickers', 'is_public')) {
            $updates['is_public'] = true;
        }

        if (Schema::hasColumn('artist_stickers', 'is_free')) {
            $updates['is_free'] = true;
        }

        if (Schema::hasColumn('artist_stickers', 'credit_cost')) {
            $updates['credit_cost'] = 0;
        }

        if ($updates !== []) {
            DB::table('artist_stickers')
                ->whereIn('user_id', $superAdminIds)
                ->update($updates);
        }

        if (Schema::hasColumn('artist_stickers', 'published_at')) {
            DB::table('artist_stickers')
                ->whereIn('user_id', $superAdminIds)
                ->whereNull('published_at')
                ->update([
                    'published_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        // Access is intentionally not revoked on rollback.
    }
};
