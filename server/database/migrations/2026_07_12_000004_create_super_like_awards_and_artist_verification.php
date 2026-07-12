<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('super_like_awards')) {
            Schema::create('super_like_awards', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('icon', 32);
                $table->unsignedInteger('credit_cost')->default(1);
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('super_likes') && ! Schema::hasColumn('super_likes', 'super_like_award_id')) {
            Schema::table('super_likes', function (Blueprint $table) {
                $table->foreignUuid('super_like_award_id')
                    ->nullable()
                    ->after('receiver_id')
                    ->constrained('super_like_awards')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('users', 'artist_verified')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('artist_verified')->default(false)->after('role');
            });
        }

        $now = now();
        foreach (
            [
                ['name' => 'Star', 'icon' => 'star', 'credit_cost' => 1, 'sort_order' => 1],
                ['name' => 'Rocket', 'icon' => 'rocket', 'credit_cost' => 3, 'sort_order' => 2],
                ['name' => 'Glasses', 'icon' => 'glasses', 'credit_cost' => 5, 'sort_order' => 3],
            ] as $award
        ) {
            DB::table('super_like_awards')->updateOrInsert(
                ['name' => $award['name']],
                [
                    'id' => DB::table('super_like_awards')->where('name', $award['name'])->value('id') ?? (string) Str::uuid(),
                    'icon' => $award['icon'],
                    'credit_cost' => $award['credit_cost'],
                    'is_active' => true,
                    'sort_order' => $award['sort_order'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'artist_verified')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('artist_verified');
            });
        }

        if (Schema::hasTable('super_likes') && Schema::hasColumn('super_likes', 'super_like_award_id')) {
            Schema::table('super_likes', function (Blueprint $table) {
                $table->dropForeign(['super_like_award_id']);
                $table->dropColumn('super_like_award_id');
            });
        }

        Schema::dropIfExists('super_like_awards');
    }
};
