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
        if (! Schema::hasTable('commission_categories')) {
            Schema::create('commission_categories', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('slug')->unique();
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('commission_artist_profiles')) {
            Schema::create('commission_artist_profiles', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
                $table->enum('application_status', ['not_applied', 'pending', 'approved', 'rejected', 'suspended'])->default('not_applied');
                $table->boolean('commissions_enabled')->default(false);
                $table->enum('commission_status', ['open', 'waitlist', 'closed'])->default('closed');
                $table->text('application_reason')->nullable();
                $table->text('terms')->nullable();
                $table->enum('terms_moderation_status', ['pending', 'approved', 'hidden', 'suspended'])->default('approved');
                $table->unsignedInteger('customers_count')->default(0);
                $table->decimal('average_rating', 3, 2)->default(0);
                $table->unsignedInteger('ratings_count')->default(0);
                $table->timestamps();

                $table->index(['application_status', 'commissions_enabled', 'commission_status'], 'commission_artist_public_idx');
            });
        }

        if (! Schema::hasTable('commission_services')) {
            Schema::create('commission_services', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
                $table->foreignUuid('commission_category_id')->nullable()->constrained('commission_categories')->nullOnDelete();
                $table->string('title');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('image_path')->nullable();
                $table->unsignedInteger('base_price_credits')->default(0);
                $table->unsignedInteger('min_price_credits')->nullable();
                $table->unsignedInteger('delivery_days')->nullable();
                $table->unsignedInteger('slots_available')->nullable();
                $table->enum('status', ['open', 'waitlist', 'closed', 'paused'])->default('open');
                $table->json('flow')->nullable();
                $table->text('terms')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_published')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['is_published', 'status', 'sort_order'], 'commission_services_public_idx');
                $table->index('user_id');
            });
        }

        if (! Schema::hasTable('commission_orders')) {
            Schema::create('commission_orders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('commission_service_id')->nullable()->constrained('commission_services')->nullOnDelete();
                $table->foreignUuid('artist_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('customer_id')->constrained('users')->cascadeOnDelete();
                $table->enum('status', [
                    'requested',
                    'quoted',
                    'awaiting_payment',
                    'in_progress',
                    'delivered',
                    'completed',
                    'cancelled',
                    'disputed',
                ])->default('requested');
                $table->unsignedInteger('quote_credits')->nullable();
                $table->json('flow_snapshot')->nullable();
                $table->timestamp('auto_release_at')->nullable();
                $table->timestamps();

                $table->index(['artist_id', 'status']);
                $table->index(['customer_id', 'status']);
            });
        }

        if (! Schema::hasTable('commission_ratings')) {
            Schema::create('commission_ratings', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('commission_order_id')->nullable()->constrained('commission_orders')->nullOnDelete();
                $table->foreignUuid('commission_service_id')->nullable()->constrained('commission_services')->nullOnDelete();
                $table->foreignUuid('artist_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('customer_id')->constrained('users')->cascadeOnDelete();
                $table->unsignedTinyInteger('rating');
                $table->text('comment')->nullable();
                $table->enum('status', ['published', 'appealed', 'hidden'])->default('published');
                $table->timestamps();

                $table->index(['artist_id', 'status']);
                $table->index(['commission_service_id', 'status'], 'commission_ratings_service_status_idx');
            });
        }

        $this->seedDefaultCategories();
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_ratings');
        Schema::dropIfExists('commission_orders');
        Schema::dropIfExists('commission_services');
        Schema::dropIfExists('commission_artist_profiles');
        Schema::dropIfExists('commission_categories');
    }

    private function seedDefaultCategories(): void
    {
        $categories = [
            ['name' => 'Illustration', 'slug' => 'illustration'],
            ['name' => 'Character Design', 'slug' => 'character-design'],
            ['name' => 'Webtoon Art', 'slug' => 'webtoon-art'],
            ['name' => 'Novel Cover', 'slug' => 'novel-cover'],
            ['name' => 'Stickers', 'slug' => 'stickers'],
        ];

        foreach ($categories as $index => $category) {
            DB::table('commission_categories')->updateOrInsert(
                ['slug' => $category['slug']],
                [
                    'id' => DB::table('commission_categories')->where('slug', $category['slug'])->value('id') ?: (string) Str::uuid(),
                    'name' => $category['name'],
                    'sort_order' => $index + 1,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
};
