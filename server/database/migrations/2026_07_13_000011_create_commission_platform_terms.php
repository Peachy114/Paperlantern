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
        if (! Schema::hasTable('commission_platform_terms')) {
            Schema::create('commission_platform_terms', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('key')->unique();
                $table->json('terms');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        DB::table('commission_platform_terms')->updateOrInsert(
            ['key' => 'default'],
            [
                'id' => DB::table('commission_platform_terms')->where('key', 'default')->value('id') ?: (string) Str::uuid(),
                'terms' => json_encode([
                    'Commission requests start with a quote before payment is collected.',
                    'Paid credits are held for delivery review and release after 5 days if there is no dispute.',
                    'Completed commissions only can receive public ratings.',
                    'Refunds, cancellations, and invalid ratings can be escalated to support.',
                ]),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_platform_terms');
    }
};
