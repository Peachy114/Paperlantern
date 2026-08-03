<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // ── Standalone tables: nothing else references their id ────
        $standaloneTables = [
            'withdrawal_requests',
            'sticky_notes',
            'chapter_images',
            'chapter_likes',
            'storyteller_earnings',
            'chapter_unlocks',
            'violations',
            'announcements',
            'earning_transactions',
            'chapter_views',
        ];

        foreach ($standaloneTables as $table) {
            DB::statement("ALTER TABLE {$table} ADD COLUMN id_uuid CHAR(36) NULL AFTER id");
            DB::statement("UPDATE {$table} SET id_uuid = UUID()");
            DB::statement("ALTER TABLE {$table} DROP PRIMARY KEY, DROP COLUMN id");
            DB::statement("ALTER TABLE {$table} CHANGE id_uuid id CHAR(36) NOT NULL");
            DB::statement("ALTER TABLE {$table} ADD PRIMARY KEY (id)");
        }

        // ── wallets: id is referenced by wallet_transactions.wallet_id ──
        DB::statement('ALTER TABLE wallets ADD COLUMN id_uuid CHAR(36) NULL AFTER id');
        DB::statement('UPDATE wallets SET id_uuid = UUID()');

        DB::statement('ALTER TABLE wallet_transactions ADD COLUMN wallet_id_uuid CHAR(36) NULL AFTER wallet_id');
        DB::statement('UPDATE wallet_transactions wt JOIN wallets w ON wt.wallet_id = w.id SET wt.wallet_id_uuid = w.id_uuid');

        DB::statement('ALTER TABLE wallet_transactions DROP FOREIGN KEY wallet_transactions_wallet_id_foreign');

        DB::statement('ALTER TABLE wallets DROP PRIMARY KEY, DROP COLUMN id');
        DB::statement('ALTER TABLE wallets CHANGE id_uuid id CHAR(36) NOT NULL');
        DB::statement('ALTER TABLE wallets ADD PRIMARY KEY (id)');

        DB::statement('ALTER TABLE wallet_transactions DROP COLUMN wallet_id');
        DB::statement('ALTER TABLE wallet_transactions CHANGE wallet_id_uuid wallet_id CHAR(36) NOT NULL');
        DB::statement('ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_wallet_id_foreign FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE');

        // ── wallet_transactions: convert its own id too (standalone) ──
        DB::statement('ALTER TABLE wallet_transactions ADD COLUMN id_uuid CHAR(36) NULL AFTER id');
        DB::statement('UPDATE wallet_transactions SET id_uuid = UUID()');
        DB::statement('ALTER TABLE wallet_transactions DROP PRIMARY KEY, DROP COLUMN id');
        DB::statement('ALTER TABLE wallet_transactions CHANGE id_uuid id CHAR(36) NOT NULL');
        DB::statement('ALTER TABLE wallet_transactions ADD PRIMARY KEY (id)');

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    public function down(): void
    {
        throw new \RuntimeException('Not reversible. Restore from backup_before_remaining_uuid_fix_*.sql if needed.');
    }
};
