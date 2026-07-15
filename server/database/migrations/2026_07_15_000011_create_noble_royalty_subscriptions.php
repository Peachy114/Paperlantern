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
        if (Schema::hasTable('artist_stickers')) {
            Schema::table('artist_stickers', function (Blueprint $table) {
                if (! Schema::hasColumn('artist_stickers', 'is_public')) {
                    $table->boolean('is_public')->default(false)->after('credit_cost');
                }
                if (! Schema::hasColumn('artist_stickers', 'subscription_free')) {
                    $table->boolean('subscription_free')->default(false)->after('is_public');
                }
                if (! Schema::hasColumn('artist_stickers', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('subscription_free');
                }
            });
        }

        if (Schema::hasTable('profile_borders')) {
            Schema::table('profile_borders', function (Blueprint $table) {
                if (! Schema::hasColumn('profile_borders', 'is_public')) {
                    $table->boolean('is_public')->default(false)->after('is_default');
                }
                if (! Schema::hasColumn('profile_borders', 'is_free')) {
                    $table->boolean('is_free')->default(true)->after('is_public');
                }
                if (! Schema::hasColumn('profile_borders', 'credit_cost')) {
                    $table->unsignedInteger('credit_cost')->default(0)->after('is_free');
                }
                if (! Schema::hasColumn('profile_borders', 'subscription_free')) {
                    $table->boolean('subscription_free')->default(false)->after('credit_cost');
                }
                if (! Schema::hasColumn('profile_borders', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('subscription_free');
                }
            });
        }

        Schema::create('noble_royalty_gifts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('giver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->string('giftable_type');
            $table->uuid('giftable_id');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['recipient_id', 'giftable_type', 'giftable_id'], 'noble_gifts_unique');
            $table->index(['giftable_type', 'giftable_id']);
        });

        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('monthly_credit_cost')->default(0);
            $table->boolean('is_recommended')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('unlimited_board')->default(false);
            $table->unsignedInteger('board_limit')->default(10);
            $table->unsignedInteger('free_boost_days')->default(0);
            $table->boolean('early_access')->default(false);
            $table->json('perks')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('subscription_plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $table->enum('status', ['active', 'cancelled', 'suspended', 'expired'])->default('active');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('grace_ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'ends_at']);
        });

        DB::table('subscription_plans')->insert([
            [
                'id' => (string) Str::uuid(),
                'name' => 'Noble Starter',
                'slug' => 'noble-starter',
                'description' => 'A friendly starter plan for creators and wanderers who want more room and monthly perks.',
                'monthly_credit_cost' => 60,
                'is_recommended' => false,
                'is_active' => true,
                'unlimited_board' => false,
                'board_limit' => 25,
                'free_boost_days' => 1,
                'early_access' => true,
                'perks' => json_encode([
                    'Free selected Noble Royalty stickers',
                    'Free selected Noble Royalty borders',
                    'Publish public borders and stickers without the 20 credit publish fee',
                    'Early access to selected webcomics and novels',
                ]),
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Noble Plus',
                'slug' => 'noble-plus',
                'description' => 'Recommended for active profile builders and artists who boost every month.',
                'monthly_credit_cost' => 120,
                'is_recommended' => true,
                'is_active' => true,
                'unlimited_board' => true,
                'board_limit' => 999,
                'free_boost_days' => 3,
                'early_access' => true,
                'perks' => json_encode([
                    'Unlimited My Board pieces while active',
                    'Three free boost days each subscription month',
                    'Free selected stickers and borders',
                    'Free public publishing for Noble Royalty assets',
                    'Early access to selected webcomics and novels',
                ]),
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Royal Atelier',
                'slug' => 'royal-atelier',
                'description' => 'A higher tier for artists who want the most profile freedom and monthly discovery boosts.',
                'monthly_credit_cost' => 220,
                'is_recommended' => false,
                'is_active' => true,
                'unlimited_board' => true,
                'board_limit' => 999,
                'free_boost_days' => 7,
                'early_access' => true,
                'perks' => json_encode([
                    'Unlimited My Board pieces while active',
                    'Seven free boost days each subscription month',
                    'Free selected stickers, borders, and design assets',
                    'Free public publishing for Noble Royalty assets',
                    'Early access to selected webcomics and novels',
                ]),
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::statement("ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus', 'art_download', 'commission_escrow', 'commission_release', 'commission_refund', 'noble_publish', 'subscription_purchase') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE wallet_transactions MODIFY source ENUM('purchase', 'chapter_unlock', 'refund', 'bonus', 'art_download', 'commission_escrow', 'commission_release', 'commission_refund') NOT NULL");

        Schema::dropIfExists('user_subscriptions');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('noble_royalty_gifts');

        if (Schema::hasTable('profile_borders')) {
            Schema::table('profile_borders', function (Blueprint $table) {
                foreach (['published_at', 'subscription_free', 'credit_cost', 'is_free', 'is_public'] as $column) {
                    if (Schema::hasColumn('profile_borders', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('artist_stickers')) {
            Schema::table('artist_stickers', function (Blueprint $table) {
                foreach (['published_at', 'subscription_free', 'is_public'] as $column) {
                    if (Schema::hasColumn('artist_stickers', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
