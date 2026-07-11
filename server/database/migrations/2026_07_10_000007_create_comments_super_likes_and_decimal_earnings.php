<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('comments')) {
            Schema::create('comments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
                $table->string('commentable_type');
                $table->uuid('commentable_id');
                $table->text('body')->nullable();
                $table->foreignUuid('artist_sticker_id')
                    ->nullable()
                    ->constrained('artist_stickers')
                    ->nullOnDelete();
                $table->string('status')->default('visible');
                $table->unsignedBigInteger('super_likes_count')->default(0);
                $table->decimal('super_like_credits', 10, 2)->default(0);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['commentable_type', 'commentable_id']);
                $table->index(['user_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('super_likes')) {
            Schema::create('super_likes', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('receiver_id')->constrained('users')->cascadeOnDelete();
                $table->string('super_likeable_type');
                $table->uuid('super_likeable_id');
                $table->decimal('credits_spent', 10, 2)->default(1);
                $table->decimal('receiver_cut', 10, 2)->default(0.80);
                $table->decimal('platform_cut', 10, 2)->default(0.20);
                $table->timestamps();

                $table->index(['super_likeable_type', 'super_likeable_id']);
                $table->index(['receiver_id', 'created_at']);
            });
        }

        foreach (['works', 'chapters'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (! Schema::hasColumn($tableName, 'comments_count')) {
                    $table->unsignedBigInteger('comments_count')->default(0)->after('likes');
                }
                if (! Schema::hasColumn($tableName, 'super_likes_count')) {
                    $table->unsignedBigInteger('super_likes_count')->default(0)->after('comments_count');
                }
                if (! Schema::hasColumn($tableName, 'super_like_credits')) {
                    $table->decimal('super_like_credits', 10, 2)->default(0)->after('super_likes_count');
                }
            });
        }

        $this->makeDecimalColumns();

        Schema::table('earning_transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('earning_transactions', 'source')) {
                $table->string('source')->default('chapter_unlock')->after('reader_id');
            }
            if (! Schema::hasColumn('earning_transactions', 'earnable_type')) {
                $table->string('earnable_type')->nullable()->after('chapter_id');
            }
            if (! Schema::hasColumn('earning_transactions', 'earnable_id')) {
                $table->uuid('earnable_id')->nullable()->after('earnable_type');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('super_likes');
        Schema::dropIfExists('comments');
    }

    private function makeDecimalColumns(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE storyteller_earnings MODIFY balance DECIMAL(10,2) NOT NULL DEFAULT 0');
            DB::statement('ALTER TABLE earning_transactions DROP FOREIGN KEY earning_transactions_chapter_id_foreign');
            DB::statement('ALTER TABLE earning_transactions MODIFY chapter_id CHAR(36) NULL');
            DB::statement('ALTER TABLE earning_transactions MODIFY credits_spent DECIMAL(10,2) NOT NULL');
            DB::statement('ALTER TABLE earning_transactions MODIFY platform_cut DECIMAL(10,2) NOT NULL');
            DB::statement('ALTER TABLE earning_transactions MODIFY storyteller_cut DECIMAL(10,2) NOT NULL');
            DB::statement('ALTER TABLE withdrawal_requests MODIFY credits_redeemed DECIMAL(10,2) NOT NULL');

            if (Schema::hasColumn('arts', 'super_like_credits')) {
                DB::statement('ALTER TABLE arts MODIFY super_like_credits DECIMAL(10,2) NOT NULL DEFAULT 0');
            }

            DB::statement('ALTER TABLE earning_transactions ADD CONSTRAINT earning_transactions_chapter_id_foreign FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE');
            return;
        }

        if ($driver !== 'sqlite') {
            Schema::table('storyteller_earnings', function (Blueprint $table) {
                $table->decimal('balance', 10, 2)->default(0)->change();
            });
            Schema::table('earning_transactions', function (Blueprint $table) {
                $table->string('chapter_id', 36)->nullable()->change();
                $table->decimal('credits_spent', 10, 2)->change();
                $table->decimal('platform_cut', 10, 2)->change();
                $table->decimal('storyteller_cut', 10, 2)->change();
            });
            Schema::table('withdrawal_requests', function (Blueprint $table) {
                $table->decimal('credits_redeemed', 10, 2)->change();
            });
        }
    }
};
