<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommissionDeliveryFile;
use App\Models\CommissionMessage;
use App\Models\CommissionOrder;
use App\Models\RoyaltyDesignAsset;
use App\Models\User;
use App\Services\CommissionOrderService;
use App\Services\ArtWatermarkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CommissionMessageController extends Controller
{
    public function __construct(private CommissionOrderService $orders) {}

    public function threads(Request $request): JsonResponse
    {
        $user = $request->user();

        $orders = CommissionOrder::query()
            ->where(function ($query) use ($user) {
                $query->where('artist_id', $user->id)->orWhere('customer_id', $user->id);
            })
            ->with([
                'service:id,title,slug,image_path',
                'artist:id,name,username,avatar,artist_verified',
                'customer:id,name,username,avatar',
                'messages' => fn($query) => $query->latest()->limit(1),
                'messages.sender:id,name,username,avatar',
            ])
            ->latest('updated_at')
            ->paginate(30);

        $orders->getCollection()->transform(fn(CommissionOrder $order) => $this->formatThread($order, $user->id));

        return response()->json([
            'threads' => $orders,
            'preferences' => $this->formatPreferences($user),
        ]);
    }

    public function startDirect(Request $request, string $username): JsonResponse
    {
        $artist = User::query()->where('username', $username)->firstOrFail();
        abort_if($artist->id === $request->user()->id, 422, 'You cannot message yourself.');

        $order = CommissionOrder::query()
            ->whereNull('commission_service_id')
            ->where('artist_id', $artist->id)
            ->where('customer_id', $request->user()->id)
            ->first();

        if (! $order) {
            $order = CommissionOrder::create([
                'commission_service_id' => null,
                'artist_id' => $artist->id,
                'customer_id' => $request->user()->id,
                'status' => 'requested',
                'request_message' => null,
                'reference_notes' => null,
                'quote_credits' => 0,
                'credits_checked' => 0,
                'escrow_credits' => 0,
                'flow_snapshot' => [],
                'current_step_index' => 0,
                'auto_pay_agreed' => false,
            ]);
        }

        $order->load([
            'service:id,title,slug,image_path',
            'artist:id,name,username,avatar,artist_verified',
            'customer:id,name,username,avatar',
            'messages' => fn($query) => $query->latest()->limit(1),
            'messages.sender:id,name,username,avatar',
        ]);

        return response()->json([
            'message' => 'Conversation ready.',
            'thread' => $this->formatThread($order, $request->user()->id),
        ]);
    }

    public function show(Request $request, CommissionOrder $order): JsonResponse
    {
        $this->authorizeParticipant($request, $order);
        $this->markOrderRead($request, $order);

        $validated = $request->validate([
            'before' => ['nullable', 'date'],
        ]);

        $order->loadMissing([
            'service:id,title,slug,image_path',
            'artist:id,name,username,avatar,artist_verified',
            'customer:id,name,username,avatar',
            'revisions.requester:id,name,username,avatar',
            'deliveryFiles.uploader:id,name,username,avatar',
        ]);

        $limit = 30;
        $messages = $order->messages()
            ->with(['sender:id,name,username,avatar', 'deliveryFile'])
            ->when($validated['before'] ?? null, fn($query, $before) => $query->where('created_at', '<', $before))
            ->latest()
            ->limit($limit + 1)
            ->get();

        $hasMore = $messages->count() > $limit;
        $messages = $messages->take($limit)->reverse()->values();

        return response()->json([
            'order' => CommissionAccountController::formatOrder($order),
            'messages' => $messages
                ->map(fn(CommissionMessage $message) => $this->formatMessage($message, $order))
                ->values(),
            'pagination' => [
                'has_more' => $hasMore,
                'next_before' => $hasMore ? optional($messages->first())->created_at : null,
                'limit' => $limit,
            ],
        ]);
    }

    public function preferences(Request $request): JsonResponse
    {
        return response()->json([
            'preferences' => $this->formatPreferences($request->user()),
            'message_designs' => $this->activeRoyaltyDesigns('message_design'),
            'message_backgrounds' => $this->activeRoyaltyDesigns('message_background'),
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message_read_receipts_enabled' => ['required', 'boolean'],
            'message_design_id' => [
                'nullable',
                'uuid',
                Rule::exists('royalty_design_assets', 'id')->where('type', 'message_design'),
            ],
            'message_background_id' => [
                'nullable',
                'uuid',
                Rule::exists('royalty_design_assets', 'id')->where('type', 'message_background'),
            ],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Message settings saved.',
            'preferences' => $this->formatPreferences($request->user()->fresh()),
        ]);
    }

    public function markRead(Request $request, CommissionOrder $order): JsonResponse
    {
        $this->authorizeParticipant($request, $order);
        $this->markOrderRead($request, $order);

        return response()->json(['message' => 'Conversation marked as read.']);
    }

    public function store(Request $request, CommissionOrder $order): JsonResponse
    {
        $this->authorizeParticipant($request, $order);

        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:3000'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'upload_type' => ['nullable', 'string', 'in:image,sketch,revision,final'],
        ]);

        if (! $request->filled('body') && ! $request->hasFile('image')) {
            return response()->json(['message' => 'Write a message or attach an image.'], 422);
        }

        $uploadType = $validated['upload_type'] ?? 'image';
        if ($request->user()->id !== $order->artist_id) {
            $uploadType = 'image';
        }

        $imagePath = null;
        $deliveryFile = null;
        $kind = 'message';
        $stageIndex = null;
        $approvalStatus = null;
        if ($request->hasFile('image')) {
            $uploaded = $request->file('image');
            $originalPath = $uploaded->store("commission-messages/{$order->id}/original", 'public');

            if ($uploadType === 'final') {
                $deliveryFile = $this->createDeliveryFromMessageUpload($order, $request, $originalPath, $uploaded);
                $imagePath = $deliveryFile->preview_path ?? $deliveryFile->file_path;
                $kind = 'final_delivery';
                $order->update([
                    'status' => 'delivered',
                    'delivered_at' => now(),
                    'auto_release_at' => now()->addDays(5),
                ]);
            } elseif (in_array($uploadType, ['sketch', 'revision'], true)) {
                $imagePath = $this->createWatermarkedMessagePreview($originalPath, $order->id);
                $kind = 'stage_submission';
                $approvalStatus = 'pending';
                $stageIndex = $this->stageIndexForUploadType($order, $uploadType);
                if ($stageIndex !== null) {
                    $this->orders->advanceStage($order, $request->user(), $stageIndex, ucfirst($uploadType) . ' image submitted.');
                }
            } elseif ($request->user()->id === $order->artist_id) {
                $imagePath = $this->createWatermarkedMessagePreview($originalPath, $order->id);
            } else {
                $imagePath = $originalPath;
            }
        }

        $message = CommissionMessage::create([
            'commission_order_id' => $order->id,
            'sender_id' => $request->user()->id,
            'body' => $validated['body'] ?? null,
            'kind' => $kind,
            'upload_type' => $uploadType,
            'stage_index' => $stageIndex,
            'approval_status' => $approvalStatus,
            'delivery_file_id' => $deliveryFile?->id,
            'image_path' => $imagePath,
            'image_moderation_status' => $imagePath ? 'pending' : 'approved',
        ]);

        $order->touch();

        return response()->json([
            'message' => 'Message sent.',
            'commission_message' => $this->formatMessage($message->load(['sender:id,name,username,avatar', 'deliveryFile']), $order->fresh()),
        ], 201);
    }

    public function approveSubmission(Request $request, CommissionMessage $message): JsonResponse
    {
        $message->loadMissing('order');
        $order = $message->order;
        abort_unless($order instanceof CommissionOrder, 404);
        abort_unless($order->customer_id === $request->user()->id, 404);
        abort_unless($message->kind === 'stage_submission', 422, 'Only sketch or revision submissions need approval.');
        abort_unless($message->approval_status === 'pending', 422, 'This submission is already handled.');

        $message->update(['approval_status' => 'approved']);
        $order = $this->orders->continueFromCurrentStage($order, $request->user());
        $order->touch();

        return response()->json([
            'message' => ucfirst((string) $message->upload_type) . ' approved.',
            'order' => CommissionAccountController::formatOrder($order->fresh(['service', 'artist', 'revisions.requester', 'deliveryFiles.uploader'])),
            'commission_message' => $this->formatMessage($message->fresh(['sender:id,name,username,avatar', 'deliveryFile']), $order),
        ]);
    }

    private function authorizeParticipant(Request $request, CommissionOrder $order): void
    {
        abort_unless(
            in_array($request->user()->id, [$order->artist_id, $order->customer_id], true),
            404
        );
    }

    private function createWatermarkedMessagePreview(string $originalPath, string $orderId): string
    {
        $extension = pathinfo($originalPath, PATHINFO_EXTENSION) ?: 'jpg';
        $displayPath = "commission-messages/{$orderId}/display/" . pathinfo($originalPath, PATHINFO_FILENAME) . ".{$extension}";

        app(ArtWatermarkService::class)->createDisplayCopy(
            \Storage::disk('public')->path($originalPath),
            $displayPath,
            true,
            'messages',
        );

        return $displayPath;
    }

    private function createDeliveryFromMessageUpload(CommissionOrder $order, Request $request, string $originalPath, \Illuminate\Http\UploadedFile $uploaded): CommissionDeliveryFile
    {
        $previewPath = "commission-deliveries/{$order->id}/previews/" . pathinfo($originalPath, PATHINFO_FILENAME) . '.' . (pathinfo($originalPath, PATHINFO_EXTENSION) ?: 'jpg');
        app(ArtWatermarkService::class)->createDisplayCopy(
            Storage::disk('public')->path($originalPath),
            $previewPath,
            true,
            'final_delivery',
        );

        return CommissionDeliveryFile::create([
            'commission_order_id' => $order->id,
            'uploaded_by' => $request->user()->id,
            'file_path' => $originalPath,
            'preview_path' => $previewPath,
            'original_name' => $uploaded->getClientOriginalName(),
            'mime_type' => $uploaded->getClientMimeType(),
            'size_bytes' => $uploaded->getSize() ?: 0,
            'note' => $request->string('body')->toString() ?: null,
            'moderation_status' => 'pending',
        ]);
    }

    private function stageIndexForUploadType(CommissionOrder $order, string $uploadType): ?int
    {
        foreach (($order->flow_snapshot ?? []) as $index => $step) {
            if (($step['type'] ?? null) === $uploadType) {
                return (int) $index;
            }
        }

        return null;
    }

    private function formatThread(CommissionOrder $order, string $viewerId): array
    {
        $other = $order->artist_id === $viewerId ? $order->customer : $order->artist;

        return [
            'id' => $order->id,
            'status' => $order->status,
            'quote_credits' => (int) $order->quote_credits,
            'escrow_credits' => (int) $order->escrow_credits,
            'unread_count' => $this->unreadCount($order, $viewerId),
            'last_read_at' => $order->artist_id === $viewerId
                ? $order->artist_last_read_at
                : $order->customer_last_read_at,
            'updated_at' => $order->updated_at,
            'service' => $order->service ? [
                'id' => $order->service->id,
                'title' => $order->service->title,
                'slug' => $order->service->slug,
                'image_path' => $order->service->image_path,
            ] : null,
            'other_user' => $other ? [
                'id' => $other->id,
                'name' => $other->name,
                'username' => $other->username,
                'avatar' => $other->avatar,
                'artist_verified' => (bool) ($other->artist_verified ?? false),
            ] : null,
            'last_message' => $order->messages->first()
                ? $this->formatMessage($order->messages->first(), $order)
                : null,
        ];
    }

    private function formatMessage(CommissionMessage $message, ?CommissionOrder $order = null): array
    {
        $order ??= $message->order;
        $recipientReadAt = null;
        if ($order) {
            $recipientReadAt = $message->sender_id === $order->artist_id
                ? $order->customer_last_read_at
                : $order->artist_last_read_at;
        }

        return [
            'id' => $message->id,
            'body' => $message->body,
            'kind' => $message->kind ?? 'message',
            'upload_type' => $message->upload_type,
            'stage_index' => $message->stage_index,
            'approval_status' => $message->approval_status,
            'delivery_file' => $message->deliveryFile ? CommissionAccountController::formatDeliveryFile($message->deliveryFile) : null,
            'image_path' => $message->image_moderation_status === 'suspended' ? null : $message->image_path,
            'image_moderation_status' => $message->image_moderation_status,
            'created_at' => $message->created_at,
            'read_by_recipient' => $recipientReadAt
                ? $recipientReadAt->greaterThanOrEqualTo($message->created_at)
                : false,
            'sender' => $message->sender ? [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
                'username' => $message->sender->username,
                'avatar' => $message->sender->avatar,
            ] : null,
        ];
    }

    private function markOrderRead(Request $request, CommissionOrder $order): void
    {
        $column = $order->artist_id === $request->user()->id
            ? 'artist_last_read_at'
            : 'customer_last_read_at';

        DB::table('commission_orders')
            ->where('id', $order->id)
            ->update([$column => now()]);

        $order->forceFill([$column => now()]);
    }

    private function unreadCount(CommissionOrder $order, string $viewerId): int
    {
        $lastReadAt = $order->artist_id === $viewerId
            ? $order->artist_last_read_at
            : $order->customer_last_read_at;

        return $order->messages()
            ->where('sender_id', '!=', $viewerId)
            ->when($lastReadAt, fn($query) => $query->where('created_at', '>', $lastReadAt))
            ->count();
    }

    private function activeRoyaltyDesigns(string $type)
    {
        return RoyaltyDesignAsset::query()
            ->where('type', $type)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();
    }

    private function formatPreferences($user): array
    {
        return [
            'message_read_receipts_enabled' => (bool) ($user->message_read_receipts_enabled ?? true),
            'message_design_id' => $user->message_design_id,
            'message_background_id' => $user->message_background_id,
        ];
    }
}
