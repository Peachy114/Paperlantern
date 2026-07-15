<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('arts')
            ->where('download_policy', 'paid')
            ->update([
                'downloads_count' => DB::raw('(SELECT COUNT(*) FROM art_downloads WHERE art_downloads.art_id = arts.id)'),
            ]);
    }

    public function down(): void
    {
        //
    }
};
