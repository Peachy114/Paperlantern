<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            if (! Schema::hasColumn('comments', 'reply_to_id')) {
                $table->foreignUuid('reply_to_id')
                    ->nullable()
                    ->after('parent_id')
                    ->constrained('comments')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            if (Schema::hasColumn('comments', 'reply_to_id')) {
                $table->dropForeign(['reply_to_id']);
                $table->dropColumn('reply_to_id');
            }
        });
    }
};
