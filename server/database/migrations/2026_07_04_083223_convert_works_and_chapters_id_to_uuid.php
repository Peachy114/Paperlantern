<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            // ── Finish WORKS -> chapters.work_id swap ────────────────
            DB::statement(
                'ALTER TABLE chapters
                 ADD COLUMN work_id_uuid CHAR(36) NULL AFTER work_id'
            );

            DB::statement(
                'UPDATE chapters
                 SET work_id_uuid = work_id'
            );

            DB::statement(
                'ALTER TABLE chapters
                 DROP FOREIGN KEY chapters_work_id_foreign'
            );

            DB::statement(
                'ALTER TABLE chapters
                 DROP INDEX chapters_work_id_slug_unique'
            );

            DB::statement(
                'ALTER TABLE chapters
                 DROP COLUMN work_id'
            );

            DB::statement(
                'ALTER TABLE chapters
                 CHANGE work_id_uuid work_id CHAR(36) NOT NULL'
            );

            DB::statement(
                'ALTER TABLE chapters
                 ADD UNIQUE KEY chapters_work_id_slug_unique (work_id, slug)'
            );

            DB::statement(
                'ALTER TABLE chapters
                 ADD CONSTRAINT chapters_work_id_foreign
                 FOREIGN KEY (work_id)
                 REFERENCES works(id)
                 ON DELETE CASCADE'
            );

            // ── CHAPTERS: convert id to UUID ─────────────────────────
            DB::statement(
                'ALTER TABLE chapters
                 ADD COLUMN id_uuid CHAR(36) NULL AFTER id'
            );

            DB::statement(
                'UPDATE chapters
                 SET id_uuid = UUID()'
            );

            $childTables = [
                'chapter_images' => null,

                'chapter_likes' => [
                    'index' => 'chapter_likes_chapter_id_user_id_unique',
                    'cols' => '(chapter_id, user_id)',
                ],

                'chapter_unlocks' => [
                    'index' => 'chapter_unlocks_user_id_chapter_id_unique',
                    'cols' => '(user_id, chapter_id)',
                ],

                'earning_transactions' => null,
                'chapter_views' => null,
            ];

            /*
            |--------------------------------------------------------------------------
            | Existing database support
            |--------------------------------------------------------------------------
            |
            | An older database may already contain chapter_revisions.
            | During migrate:fresh, that table does not exist yet.
            |
            */
            if (
                Schema::hasTable('chapter_revisions') &&
                Schema::hasColumn('chapter_revisions', 'chapter_id')
            ) {
                $childTables['chapter_revisions'] = null;
            }

            // Add temporary UUID foreign-key columns.
            foreach (array_keys($childTables) as $table) {
                DB::statement(
                    "ALTER TABLE {$table}
                     ADD COLUMN chapter_id_uuid CHAR(36) NULL AFTER chapter_id"
                );

                DB::statement(
                    "UPDATE {$table} child
                     JOIN chapters chapter
                       ON child.chapter_id = chapter.id
                     SET child.chapter_id_uuid = chapter.id_uuid"
                );
            }

            // Remove foreign keys pointing to the old chapter ID.
            foreach (array_keys($childTables) as $table) {
                DB::statement(
                    "ALTER TABLE {$table}
                     DROP FOREIGN KEY {$table}_chapter_id_foreign"
                );
            }

            // Replace chapters.id.
            DB::statement(
                'ALTER TABLE chapters
                 DROP PRIMARY KEY,
                 DROP COLUMN id'
            );

            DB::statement(
                'ALTER TABLE chapters
                 CHANGE id_uuid id CHAR(36) NOT NULL'
            );

            DB::statement(
                'ALTER TABLE chapters
                 ADD PRIMARY KEY (id)'
            );

            // Replace each child table chapter_id.
            foreach ($childTables as $table => $unique) {
                if ($unique) {
                    DB::statement(
                        "ALTER TABLE {$table}
                         DROP INDEX {$unique['index']}"
                    );
                }

                DB::statement(
                    "ALTER TABLE {$table}
                     DROP COLUMN chapter_id"
                );

                DB::statement(
                    "ALTER TABLE {$table}
                     CHANGE chapter_id_uuid chapter_id CHAR(36) NOT NULL"
                );

                if ($unique) {
                    DB::statement(
                        "ALTER TABLE {$table}
                         ADD UNIQUE KEY {$unique['index']} {$unique['cols']}"
                    );
                }
            }

            // Restore chapter foreign keys.
            foreach (array_keys($childTables) as $table) {
                DB::statement(
                    "ALTER TABLE {$table}
                     ADD CONSTRAINT {$table}_chapter_id_foreign
                     FOREIGN KEY (chapter_id)
                     REFERENCES chapters(id)
                     ON DELETE CASCADE"
                );
            }
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    public function down(): void
    {
        throw new RuntimeException(
            'Not reversible. Restore from backup_before_works_chapters_uuid_fix_*.sql if needed.'
        );
    }
};
