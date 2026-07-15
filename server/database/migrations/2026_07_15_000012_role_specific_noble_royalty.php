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
        Schema::table('subscription_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('subscription_plans', 'audience')) {
                $table->string('audience')->default('wanderer')->after('slug');
            }
            if (! Schema::hasColumn('subscription_plans', 'tier_key')) {
                $table->string('tier_key')->default('starter')->after('audience');
            }
        });

        Schema::table('royalty_design_assets', function (Blueprint $table) {
            if (! Schema::hasColumn('royalty_design_assets', 'user_id')) {
                $table->foreignUuid('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('royalty_design_assets', 'is_public')) {
                $table->boolean('is_public')->default(true)->after('is_active');
            }
            if (! Schema::hasColumn('royalty_design_assets', 'subscription_free')) {
                $table->boolean('subscription_free')->default(false)->after('is_public');
            }
            if (! Schema::hasColumn('royalty_design_assets', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('subscription_free');
            }
        });

        $this->upsertPlan('noble-starter', 'wanderer-noble-starter', 'Noble Starter', 'wanderer', 'starter', 60, false, 25, 1, [
            'Free selected Noble Royalty stickers',
            'Free selected Noble Royalty borders',
            'Early access to selected webcomics and novels',
        ], 1);
        $this->upsertPlan('noble-plus', 'wanderer-noble-plus', 'Noble Plus', 'wanderer', 'plus', 120, true, 999, 3, [
            'Unlimited My Board pieces while active',
            'Three free boost days each subscription month',
            'Free selected Noble Royalty assets',
            'Early access to selected webcomics and novels',
        ], 2);
        $this->upsertPlan('royal-atelier', 'wanderer-royal-atelier', 'Royal Atelier', 'wanderer', 'atelier', 220, false, 999, 7, [
            'Unlimited My Board pieces while active',
            'Seven free boost days each subscription month',
            'Free selected Noble Royalty assets',
            'Early access to selected webcomics and novels',
        ], 3);

        $this->createPlan('artist-noble-starter', 'Noble Starter', 'storyteller', 'starter', 80, false, 35, 2, [
            'Publish public stickers, borders, and message backgrounds without the 20 credit fee',
            'Free selected Noble Royalty stickers and borders',
            'Early access to selected webcomics and novels',
        ], 11);
        $this->createPlan('artist-noble-plus', 'Noble Plus', 'storyteller', 'plus', 160, true, 999, 5, [
            'Unlimited My Board pieces while active',
            'Five free boost days each subscription month',
            'Free public publishing for artist Noble Royalty assets',
            'Early access to selected webcomics and novels',
        ], 12);
        $this->createPlan('artist-royal-atelier', 'Royal Atelier', 'storyteller', 'atelier', 260, false, 999, 10, [
            'Unlimited My Board pieces while active',
            'Ten free boost days each subscription month',
            'Free public publishing for artist Noble Royalty assets',
            'Free selected Noble Royalty assets',
            'Early access to selected webcomics and novels',
        ], 13);
    }

    public function down(): void
    {
        Schema::table('royalty_design_assets', function (Blueprint $table) {
            foreach (['published_at', 'subscription_free', 'is_public', 'user_id'] as $column) {
                if (Schema::hasColumn('royalty_design_assets', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('subscription_plans', function (Blueprint $table) {
            foreach (['tier_key', 'audience'] as $column) {
                if (Schema::hasColumn('subscription_plans', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    private function upsertPlan(
        string $oldSlug,
        string $newSlug,
        string $name,
        string $audience,
        string $tierKey,
        int $cost,
        bool $recommended,
        int $boardLimit,
        int $boostDays,
        array $perks,
        int $sortOrder,
    ): void {
        $existing = DB::table('subscription_plans')->where('slug', $oldSlug)->first()
            ?? DB::table('subscription_plans')->where('slug', $newSlug)->first();

        if ($existing) {
            DB::table('subscription_plans')->where('id', $existing->id)->update([
                'name' => $name,
                'slug' => $newSlug,
                'audience' => $audience,
                'tier_key' => $tierKey,
                'monthly_credit_cost' => $cost,
                'is_recommended' => $recommended,
                'is_active' => true,
                'unlimited_board' => $boardLimit >= 999,
                'board_limit' => $boardLimit,
                'free_boost_days' => $boostDays,
                'early_access' => true,
                'perks' => json_encode($perks),
                'sort_order' => $sortOrder,
                'updated_at' => now(),
            ]);
            return;
        }

        $this->createPlan($newSlug, $name, $audience, $tierKey, $cost, $recommended, $boardLimit, $boostDays, $perks, $sortOrder);
    }

    private function createPlan(
        string $slug,
        string $name,
        string $audience,
        string $tierKey,
        int $cost,
        bool $recommended,
        int $boardLimit,
        int $boostDays,
        array $perks,
        int $sortOrder,
    ): void {
        if (DB::table('subscription_plans')->where('slug', $slug)->exists()) {
            return;
        }

        DB::table('subscription_plans')->insert([
            'id' => (string) Str::uuid(),
            'name' => $name,
            'slug' => $slug,
            'audience' => $audience,
            'tier_key' => $tierKey,
            'description' => "{$name} for " . ($audience === 'storyteller' ? 'artists' : 'wanderers') . '.',
            'monthly_credit_cost' => $cost,
            'is_recommended' => $recommended,
            'is_active' => true,
            'unlimited_board' => $boardLimit >= 999,
            'board_limit' => $boardLimit,
            'free_boost_days' => $boostDays,
            'early_access' => true,
            'perks' => json_encode($perks),
            'sort_order' => $sortOrder,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};
