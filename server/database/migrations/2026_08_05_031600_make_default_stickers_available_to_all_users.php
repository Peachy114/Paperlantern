<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Make every super-admin sticker available as a global default sticker.
     *
     * The current application identifies default stickers by ownership:
     * stickers created by a user whose role is "super_admin".
     */
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

    /**
     * This data migration intentionally does not revoke sticker access.
     *
     * Rolling it back must not suddenly remove default stickers from users who
     * may already be using them in comments, feeds, profiles, or messages.
     */
    public function down(): void
    {
        // Intentionally left unchanged to preserve existing user access.
    }
};
