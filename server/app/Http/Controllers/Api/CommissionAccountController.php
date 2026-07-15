<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommissionDeliveryFile;
use App\Models\CommissionOrder;
use App\Models\CommissionRating;
use App\Models\CommissionRevision;
use App\Models\Ticket;
use App\Services\CommissionOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionAccountController extends Controller
{
    public function __construct(private CommissionOrderService $orders) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->orders->releaseDueOrders($user->id);

        $orders = CommissionOrder::query()
            ->where('customer_id', $user->id)
            ->with([
                'service:id,title,slug,image_path,delivery_days',
                'artist:id,name,username,avatar,artist_verified',
                'revisions.requester:id,name,username,avatar',
                'deliveryFiles.uploader:id,name,username,avatar',
            ])
            ->withCount('messages')
            ->latest()
            ->paginate(30);

        $orders->getCollection()->transform(fn(CommissionOrder $order) => $this->formatOrder($order));

        return response()->json(['orders' => $orders]);
    }

    public function update(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 404);

        $validated = $request->validate([
            'action' => ['required', 'in:cancel,dispute'],
        ]);

        if ($validated['action'] === 'cancel') {
            $order = $this->orders->refund($order);

            return response()->json([
                'message' => 'Commission cancelled and eligible escrow was refunded.',
                'order' => $this->formatOrder($order),
            ]);
        }

        $order->update([
            'status' => 'disputed',
            'disputed_at' => now(),
        ]);
        $this->createDisputeTicket($request->user()->id, $order, 'Wanderer disputed commission order.');

        return response()->json([
            'message' => 'Commission marked as disputed. Support can review it.',
            'order' => $this->formatOrder($order->fresh(['service', 'artist'])),
        ]);
    }

    public function release(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 404);
        abort_unless($order->status === 'delivered', 422, 'Only delivered commissions can be approved.');

        $order = $this->orders->release($order);

        return response()->json([
            'message' => 'Commission approved. Escrow was released to the artist.',
            'order' => $this->formatOrder($order),
        ]);
    }

    public function acceptQuote(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 404);

        $order = $this->orders->acceptQuote($order, $request->user());

        return response()->json([
            'message' => 'Quote accepted and the next payment stage was moved into escrow.',
            'order' => $this->formatOrder($order),
        ]);
    }

    public function payNextStage(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 404);

        $order = $this->orders->collectNextPayment($order, $request->user());

        return response()->json([
            'message' => 'Payment stage moved into escrow.',
            'order' => $this->formatOrder($order),
        ]);
    }

    public function rate(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 404);
        abort_unless($order->status === 'completed', 422, 'Only completed commissions can be rated.');

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $rating = CommissionRating::updateOrCreate(
            [
                'commission_order_id' => $order->id,
                'customer_id' => $request->user()->id,
            ],
            [
                'commission_service_id' => $order->commission_service_id,
                'artist_id' => $order->artist_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'status' => 'published',
                'appeal_reason' => null,
                'appealed_at' => null,
                'reviewed_at' => null,
            ]
        );

        self::refreshArtistRatingStats($order->artist_id);

        return response()->json([
            'message' => 'Commission rating saved.',
            'rating' => self::formatRating($rating->fresh(['customer', 'service'])),
        ]);
    }

    public function requestRevision(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 404);
        abort_unless(in_array($order->status, ['in_progress', 'delivered'], true), 422, 'Revisions can only be requested while work is active or delivered.');

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:2000'],
            'step_index' => ['nullable', 'integer', 'min:0', 'max:100'],
            'pay_extra' => ['sometimes', 'boolean'],
        ]);

        $stepIndex = array_key_exists('step_index', $validated)
            ? (int) $validated['step_index']
            : $this->defaultCreativeStepIndex($order);
        $attempt = $this->orders->requestCreativeAttempt(
            $order,
            $request->user(),
            $stepIndex,
            $validated['reason'],
            $request->boolean('pay_extra')
        );
        $order = $attempt['order'];

        $used = CommissionRevision::query()
            ->where('commission_order_id', $order->id)
            ->count();

        $revision = CommissionRevision::create([
            'commission_order_id' => $order->id,
            'requested_by' => $request->user()->id,
            'reason' => $validated['reason'],
            'revision_number' => $used + 1,
            'requested_step_index' => $stepIndex,
            'requested_step_type' => $attempt['step']['type'] ?? null,
            'extra_attempt_credits' => $attempt['extra_credits'],
            'status' => 'requested',
        ]);

        return response()->json([
            'message' => $attempt['extra_credits'] > 0
                ? "Extra attempt paid ({$attempt['extra_credits']} credits) and requested."
                : 'Revision requested.',
            'revision' => self::formatRevision($revision->load('requester')),
            'order' => self::formatOrder($order->fresh(['service', 'artist', 'revisions.requester', 'deliveryFiles.uploader'])),
        ], 201);
    }

    public function continueStage(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 404);

        $order = $this->orders->continueFromCurrentStage($order, $request->user());

        return response()->json([
            'message' => 'Original flow continued.',
            'order' => self::formatOrder($order->fresh(['service', 'artist', 'revisions.requester', 'deliveryFiles.uploader'])),
        ]);
    }

    public function payFinalDelivery(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 404);

        $result = $this->orders->payFinalAndRelease($order, $request->user());

        return response()->json([
            'message' => "Client paid {$result['amount']} credits. The artist wallet will receive the commission release.",
            'paid_credits' => $result['amount'],
            'order' => self::formatOrder($result['order']->fresh(['service', 'artist', 'revisions.requester', 'deliveryFiles.uploader'])),
        ]);
    }

    public static function formatOrder(CommissionOrder $order): array
    {
        return [
            'id' => $order->id,
            'status' => $order->status,
            'request_message' => $order->request_message,
            'reference_notes' => $order->reference_notes,
            'quote_credits' => (int) $order->quote_credits,
            'quote_note' => $order->quote_note,
            'credits_checked' => (int) $order->credits_checked,
            'escrow_credits' => (int) $order->escrow_credits,
            'released_credits' => (int) $order->released_credits,
            'refunded_credits' => (int) $order->refunded_credits,
            'flow_snapshot' => $order->flow_snapshot ?? [],
            'paid_steps' => $order->paid_steps ?? [],
            'stage_notes' => $order->stage_notes ?? [],
            'stage_attempts_used' => $order->stage_attempts_used ?? [],
            'current_step_index' => (int) $order->current_step_index,
            'auto_release_at' => $order->auto_release_at,
            'payment_due_at' => $order->payment_due_at,
            'final_payment_paid_at' => $order->final_payment_paid_at,
            'final_payment_due_credits' => max(0, (int) $order->quote_credits - (int) $order->escrow_credits),
            'extra_attempt_credits' => max(1, (int) ceil(max(1, (int) $order->quote_credits) * 0.10)),
            'auto_pay_agreed' => (bool) $order->auto_pay_agreed,
            'accepted_at' => $order->accepted_at,
            'quote_accepted_at' => $order->quote_accepted_at,
            'delivered_at' => $order->delivered_at,
            'completed_at' => $order->completed_at,
            'archived_at' => $order->archived_at,
            'cancelled_at' => $order->cancelled_at,
            'disputed_at' => $order->disputed_at,
            'messages_count' => (int) ($order->messages_count ?? 0),
            'revision_limit' => self::revisionLimit($order),
            'revisions' => $order->relationLoaded('revisions')
                ? $order->revisions->map(fn(CommissionRevision $revision) => self::formatRevision($revision))->values()
                : [],
            'delivery_files' => $order->relationLoaded('deliveryFiles')
                ? $order->deliveryFiles
                    ->filter(fn(CommissionDeliveryFile $file) => $file->moderation_status !== 'suspended')
                    ->map(fn(CommissionDeliveryFile $file) => self::formatDeliveryFile($file))
                    ->values()
                : [],
            'created_at' => $order->created_at,
            'service' => $order->service ? [
                'id' => $order->service->id,
                'title' => $order->service->title,
                'slug' => $order->service->slug,
                'image_path' => $order->service->image_path,
                'delivery_days' => $order->service->delivery_days,
            ] : null,
            'artist' => $order->artist ? [
                'id' => $order->artist->id,
                'name' => $order->artist->name,
                'username' => $order->artist->username,
                'avatar' => $order->artist->avatar,
                'artist_verified' => (bool) $order->artist->artist_verified,
            ] : null,
            'customer' => $order->customer ? [
                'id' => $order->customer->id,
                'name' => $order->customer->name,
                'username' => $order->customer->username,
                'avatar' => $order->customer->avatar,
            ] : null,
        ];
    }

    public static function revisionLimit(CommissionOrder $order): int
    {
        $limit = 0;
        foreach (($order->flow_snapshot ?? []) as $step) {
            if (($step['type'] ?? null) === 'revision') {
                $limit += max(0, (int) ($step['rounds'] ?? 1));
            }
        }

        return $limit;
    }

    public static function formatRevision(CommissionRevision $revision): array
    {
        return [
            'id' => $revision->id,
            'reason' => $revision->reason,
            'revision_number' => (int) $revision->revision_number,
            'requested_step_index' => $revision->requested_step_index,
            'requested_step_type' => $revision->requested_step_type,
            'extra_attempt_credits' => (int) $revision->extra_attempt_credits,
            'status' => $revision->status,
            'artist_response' => $revision->artist_response,
            'resolved_at' => $revision->resolved_at,
            'created_at' => $revision->created_at,
            'requester' => $revision->requester ? [
                'id' => $revision->requester->id,
                'name' => $revision->requester->name,
                'username' => $revision->requester->username,
                'avatar' => $revision->requester->avatar,
            ] : null,
        ];
    }

    private function defaultCreativeStepIndex(CommissionOrder $order): int
    {
        $current = (int) $order->current_step_index;
        $flow = $order->flow_snapshot ?? [];
        if (isset($flow[$current]) && in_array($flow[$current]['type'] ?? null, ['sketch', 'revision', 'draft', 'add'], true)) {
            return $current;
        }

        foreach ($flow as $index => $step) {
            if (in_array($step['type'] ?? null, ['sketch', 'revision', 'draft', 'add'], true)) {
                return (int) $index;
            }
        }

        abort(422, 'This commission flow does not have a creative stage to request again.');
    }

    public static function formatDeliveryFile(CommissionDeliveryFile $file): array
    {
        return [
            'id' => $file->id,
            'file_path' => $file->file_path,
            'preview_path' => $file->preview_path,
            'original_name' => $file->original_name,
            'mime_type' => $file->mime_type,
            'size_bytes' => (int) $file->size_bytes,
            'note' => $file->note,
            'moderation_status' => $file->moderation_status,
            'created_at' => $file->created_at,
            'uploader' => $file->uploader ? [
                'id' => $file->uploader->id,
                'name' => $file->uploader->name,
                'username' => $file->uploader->username,
                'avatar' => $file->uploader->avatar,
            ] : null,
        ];
    }

    public static function formatRating(CommissionRating $rating): array
    {
        return [
            'id' => $rating->id,
            'rating' => (int) $rating->rating,
            'comment' => $rating->comment,
            'status' => $rating->status,
            'appeal_reason' => $rating->appeal_reason,
            'appealed_at' => $rating->appealed_at,
            'reviewed_at' => $rating->reviewed_at,
            'created_at' => $rating->created_at,
            'service' => $rating->service ? [
                'id' => $rating->service->id,
                'title' => $rating->service->title,
                'slug' => $rating->service->slug,
            ] : null,
            'customer' => $rating->customer ? [
                'id' => $rating->customer->id,
                'name' => $rating->customer->name,
                'username' => $rating->customer->username,
                'avatar' => $rating->customer->avatar,
            ] : null,
        ];
    }

    public static function refreshArtistRatingStats(string $artistId): void
    {
        $ratings = CommissionRating::query()
            ->where('artist_id', $artistId)
            ->where('status', 'published');

        \App\Models\CommissionArtistProfile::query()
            ->where('user_id', $artistId)
            ->update([
                'ratings_count' => (clone $ratings)->count(),
                'average_rating' => round((float) (clone $ratings)->avg('rating'), 2),
                'customers_count' => CommissionOrder::query()
                    ->where('artist_id', $artistId)
                    ->where('status', 'completed')
                    ->distinct('customer_id')
                    ->count('customer_id'),
            ]);
    }

    private function createDisputeTicket(string $userId, CommissionOrder $order, string $message): void
    {
        $exists = Ticket::query()
            ->where('source_type', CommissionOrder::class)
            ->where('source_id', $order->id)
            ->whereIn('status', ['open', 'in_progress'])
            ->exists();

        if ($exists) {
            return;
        }

        $ticket = Ticket::create([
            'user_id' => $userId,
            'category' => 'payment',
            'subject' => 'Commission dispute',
            'message' => $message,
            'status' => 'open',
            'source_type' => CommissionOrder::class,
            'source_id' => $order->id,
        ]);

        $supportNumber = 'LNC-' . now()->format('Ymd') . '-' . strtoupper(substr(str_replace('-', '', $ticket->id), 0, 6));
        $ticket->update([
            'subject' => "Commission dispute {$supportNumber}",
            'message' => "{$message}\n\nSupport number: {$supportNumber}\nCommission order: {$order->id}",
        ]);
    }
}
