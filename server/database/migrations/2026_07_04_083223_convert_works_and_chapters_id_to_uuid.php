<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // ── Finish WORKS -> chapters.work_id swap ──────────────────
        // works.id is already UUID. work_id_uuid on chapters is already populated.
        DB::statement('ALTER TABLE chapters DROP INDEX chapters_work_id_slug_unique');
        DB::statement('ALTER TABLE chapters DROP COLUMN work_id');
        DB::statement('ALTER TABLE chapters CHANGE work_id_uuid work_id CHAR(36) NOT NULL');
        DB::statement('ALTER TABLE chapters ADD UNIQUE KEY chapters_work_id_slug_unique (work_id, slug)');
        DB::statement('ALTER TABLE chapters ADD CONSTRAINT chapters_work_id_foreign FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE');

        // ── CHAPTERS: convert id to UUID ────────────────────────────
        DB::statement('ALTER TABLE chapters ADD COLUMN id_uuid CHAR(36) NULL AFTER id');
        DB::statement('UPDATE chapters SET id_uuid = UUID()');

        $childTables = [
            'chapter_images'       => null,
            'chapter_likes'        => ['index' => 'chapter_likes_chapter_id_user_id_unique', 'cols' => '(chapter_id, user_id)'],
            'chapter_unlocks'      => ['index' => 'chapter_unlocks_user_id_chapter_id_unique', 'cols' => '(user_id, chapter_id)'],
            'earning_transactions' => null,
            'chapter_views'        => null,
        ];

        foreach (array_keys($childTables) as $table) {
            DB::statement("ALTER TABLE {$table} ADD COLUMN chapter_id_uuid CHAR(36) NULL AFTER chapter_id");
            DB::statement("UPDATE {$table} t JOIN chapters c ON t.chapter_id = c.id SET t.chapter_id_uuid = c.id_uuid");
        }

        foreach (array_keys($childTables) as $table) {
            DB::statement("ALTER TABLE {$table} DROP FOREIGN KEY {$table}_chapter_id_foreign");
        }

        DB::statement('ALTER TABLE chapters DROP PRIMARY KEY, DROP COLUMN id');
        DB::statement('ALTER TABLE chapters CHANGE id_uuid id CHAR(36) NOT NULL');
        DB::statement('ALTER TABLE chapters ADD PRIMARY KEY (id)');

        foreach ($childTables as $table => $unique) {
            if ($unique) {
                DB::statement("ALTER TABLE {$table} DROP INDEX {$unique['index']}");
            }
            DB::statement("ALTER TABLE {$table} DROP COLUMN chapter_id");
            DB::statement("ALTER TABLE {$table} CHANGE chapter_id_uuid chapter_id CHAR(36) NOT NULL");
            if ($unique) {
                DB::statement("ALTER TABLE {$table} ADD UNIQUE KEY {$unique['index']} {$unique['cols']}");
            }
        }

        foreach (array_keys($childTables) as $table) {
            DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$table}_chapter_id_foreign FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE");
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    public function down(): void
    {
        throw new \RuntimeException('Not reversible. Restore from backup_before_works_chapters_uuid_fix_*.sql if needed.');
    }
};