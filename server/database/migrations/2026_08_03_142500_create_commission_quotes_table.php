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
        Schema::create('commission_quotes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('commission_order_id')
                ->constrained('commission_orders')
                ->cascadeOnDelete();
            $table->foreignUuid('created_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedInteger('version');
            $table->unsignedInteger('quote_credits');
            $table->text('quote_note')->nullable();
            $table->json('flow_snapshot')->nullable();
            $table->string('status', 40)->default('pending');

            $table->text('renegotiation_reason')->nullable();
            $table->unsignedInteger('preferred_credits')->nullable();
            $table->text('requested_changes')->nullable();
            $table->timestamp('renegotiation_requested_at')->nullable();

            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('superseded_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['commission_order_id', 'version'],
                'commission_quotes_order_version_unique'
            );
            $table->index(
                ['commission_order_id', 'status'],
                'commission_quotes_order_status_index'
            );
        });

        $this->backfillExistingQuotes();
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_quotes');
    }

    private function backfillExistingQuotes(): void
    {
        if (! Schema::hasTable('commission_orders')) {
            return;
        }

        DB::table('commission_orders')
            ->where('quote_credits', '>', 0)
            ->orderBy('created_at')
            ->get([
                'id',
                'artist_id',
                'status',
                'quote_credits',
                'quote_note',
                'flow_snapshot',
                'quote_accepted_at',
                'created_at',
                'updated_at',
            ])
            ->each(function (object $order): void {
                $accepted = $order->quote_accepted_at !== null
                    || in_array(
                        $order->status,
                        ['in_progress', 'delivered', 'completed'],
                        true
                    );

                $status = match (true) {
                    $accepted => 'accepted',
                    $order->status === 'quoted' => 'pending',
                    $order->status === 'cancelled' => 'withdrawn',
                    default => 'superseded',
                };

                $createdAt = $order->quote_accepted_at
                    ?? $order->updated_at
                    ?? $order->created_at
                    ?? now();

                DB::table('commission_quotes')->insert([
                    'id' => (string) Str::uuid(),
                    'commission_order_id' => $order->id,
                    'created_by' => $order->artist_id,
                    'version' => 1,
                    'quote_credits' => (int) $order->quote_credits,
                    'quote_note' => $order->quote_note,
                    'flow_snapshot' => $order->flow_snapshot ?: json_encode([]),
                    'status' => $status,
                    'accepted_at' => $accepted
                        ? ($order->quote_accepted_at ?? $createdAt)
                        : null,
                    'superseded_at' => $status === 'superseded' ? $createdAt : null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            });
    }
};
