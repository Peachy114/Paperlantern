<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('earning_snapshots')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE earning_snapshots MODIFY credits_spent DECIMAL(10,2) NOT NULL');
            DB::statement('ALTER TABLE earning_snapshots MODIFY platform_cut DECIMAL(10,2) NOT NULL');
            DB::statement('ALTER TABLE earning_snapshots MODIFY storyteller_cut DECIMAL(10,2) NOT NULL');
            return;
        }

        if ($driver !== 'sqlite') {
            Schema::table('earning_snapshots', function (Blueprint $table) {
                $table->decimal('credits_spent', 10, 2)->change();
                $table->decimal('platform_cut', 10, 2)->change();
                $table->decimal('storyteller_cut', 10, 2)->change();
            });
        }
    }

    public function down(): void {}
};
