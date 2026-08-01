<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Tables already fully swapped to UUID (user_id column) in a prior run.
    // Only need their FK re-added at the end.
    private array $alreadySwapped = [
        ['table' => 'withdrawal_requests', 'column' => 'user_id', 'constraint' => 'withdrawal_requests_user_id_foreign'],
        ['table' => 'sticky_notes',        'column' => 'user_id', 'constraint' => 'sticky_notes_user_id_foreign'],
    ];

    // Simple tables: single-column index only, safe to DROP COLUMN directly.
    private array $simpleForeignKeys = [
        ['table' => 'wallets',              'column' => 'user_id',        'constraint' => 'wallets_user_id_foreign'],
        ['table' => 'storyteller_earnings', 'column' => 'user_id',        'constraint' => 'storyteller_earnings_user_id_foreign'],
        ['table' => 'violations',           'column' => 'admin_id',       'constraint' => 'violations_admin_id_foreign'],
        ['table' => 'violations',           'column' => 'user_id',        'constraint' => 'violations_user_id_foreign'],
        ['table' => 'announcements',        'column' => 'created_by',     'constraint' => 'announcements_created_by_foreign'],
        ['table' => 'wallet_transactions',  'column' => 'user_id',        'constraint' => 'wallet_transactions_user_id_foreign'],
        ['table' => 'earning_transactions', 'column' => 'reader_id',      'constraint' => 'earning_transactions_reader_id_foreign'],
        ['table' => 'earning_transactions', 'column' => 'storyteller_id', 'constraint' => 'earning_transactions_storyteller_id_foreign'],
        ['table' => 'admin_logs',           'column' => 'admin_id',       'constraint' => 'admin_logs_admin_id_foreign'],
        ['table' => 'earning_snapshots',    'column' => 'storyteller_id', 'constraint' => 'earning_snapshots_storyteller_id_foreign'],
        ['table' => 'works',                'column' => 'user_id',        'constraint' => 'works_user_id_foreign'],
        ['table' => 'chapter_views',        'column' => 'user_id',        'constraint' => 'chapter_views_user_id_foreign'],
    ];

    public function up(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // --- chapter_likes: composite unique index (chapter_id, user_id) ---
        DB::statement('ALTER TABLE chapter_likes DROP FOREIGN KEY chapter_likes_user_id_foreign');
        DB::statement('ALTER TABLE chapter_likes DROP INDEX chapter_likes_chapter_id_user_id_unique');
        if (Schema::hasColumn('chapter_likes', 'user_id_uuid')) {
            DB::statement('ALTER TABLE chapter_likes DROP COLUMN user_id');
            DB::statement('ALTER TABLE chapter_likes CHANGE user_id_uuid user_id CHAR(36) NULL');
        } else {
            DB::statement('ALTER TABLE chapter_likes MODIFY user_id CHAR(36) NULL');
        }
        DB::statement('ALTER TABLE chapter_likes ADD UNIQUE KEY chapter_likes_chapter_id_user_id_unique (chapter_id, user_id)');

        // --- chapter_unlocks: composite unique index (user_id, chapter_id) ---
        DB::statement('ALTER TABLE chapter_unlocks DROP FOREIGN KEY chapter_unlocks_user_id_foreign');
        DB::statement('ALTER TABLE chapter_unlocks DROP INDEX chapter_unlocks_user_id_chapter_id_unique');
        if (Schema::hasColumn('chapter_unlocks', 'user_id_uuid')) {
            DB::statement('ALTER TABLE chapter_unlocks DROP COLUMN user_id');
            DB::statement('ALTER TABLE chapter_unlocks CHANGE user_id_uuid user_id CHAR(36) NULL');
        } else {
            DB::statement('ALTER TABLE chapter_unlocks MODIFY user_id CHAR(36) NULL');
        }
        DB::statement('ALTER TABLE chapter_unlocks ADD UNIQUE KEY chapter_unlocks_user_id_chapter_id_unique (user_id, chapter_id)');

        // --- simple tables: single-column index, safe direct swap ---
        foreach ($this->simpleForeignKeys as $fk) {
            $table = $fk['table'];
            $old = $fk['column'];
            $new = "{$old}_uuid";

            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$fk['constraint']}`");

            if (Schema::hasColumn($table, $new)) {
                // production path: uuid column already populated, finish the swap
                DB::statement("ALTER TABLE `{$table}` DROP COLUMN `{$old}`");
                DB::statement("ALTER TABLE `{$table}` CHANGE `{$new}` `{$old}` CHAR(36) NULL");
            } else {
                // fresh install path: table is empty, just retype directly
                DB::statement("ALTER TABLE `{$table}` MODIFY `{$old}` CHAR(36) NULL");
            }
        }

        // --- personal_access_tokens: composite index (tokenable_type, tokenable_id) ---
        // Polymorphic column, no single-column FK constraint by default, so no drop needed here.
        DB::statement('ALTER TABLE personal_access_tokens DROP INDEX personal_access_tokens_tokenable_type_tokenable_id_index');
        if (Schema::hasColumn('personal_access_tokens', 'tokenable_id_uuid')) {
            DB::statement('ALTER TABLE personal_access_tokens DROP COLUMN tokenable_id');
            DB::statement('ALTER TABLE personal_access_tokens CHANGE tokenable_id_uuid tokenable_id CHAR(36) NULL');
        } else {
            DB::statement('ALTER TABLE personal_access_tokens MODIFY tokenable_id CHAR(36) NULL');
        }
        DB::statement('ALTER TABLE personal_access_tokens ADD INDEX personal_access_tokens_tokenable_type_tokenable_id_index (tokenable_type, tokenable_id)');

        // --- Re-add FKs for every table, including the two already swapped earlier ---
        $allForeignKeys = array_merge($this->alreadySwapped, $this->simpleForeignKeys, [
            ['table' => 'chapter_likes',   'column' => 'user_id', 'constraint' => 'chapter_likes_user_id_foreign'],
            ['table' => 'chapter_unlocks', 'column' => 'user_id', 'constraint' => 'chapter_unlocks_user_id_foreign'],
        ]);

        foreach ($allForeignKeys as $fk) {
            if ($this->foreignKeyExists($fk['table'], $fk['constraint'])) {
                continue;
            }
            DB::statement("ALTER TABLE `{$fk['table']}` ADD CONSTRAINT `{$fk['constraint']}` FOREIGN KEY (`{$fk['column']}`) REFERENCES `users`(`id`) ON DELETE CASCADE");
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        $result = DB::selectOne(
            "SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND CONSTRAINT_NAME = ?
               AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
            [$table, $constraint]
        );

        return $result && $result->cnt > 0;
    }

    public function down(): void
    {
        throw new \RuntimeException('Not reversible. Restore from backup_before_uuid_fix_20260703.sql if needed.');
    }
};