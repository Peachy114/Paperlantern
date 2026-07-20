<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use App\Models\CommissionArtistProfile;
use App\Models\CommissionCategory;
use App\Models\CommissionDeliveryFile;
use App\Models\CommissionOrder;
use App\Models\CommissionRating;
use App\Models\CommissionRevision;
use App\Models\CommissionService;
use App\Models\EarningTransaction;
use App\Models\FeatureBoost;
use App\Models\Ticket;
use App\Services\CommissionOrderService;
use App\Services\ArtWatermarkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CommissionController extends Controller
{
    public function __construct(private CommissionOrderService $orders, private ArtWatermarkService $watermarks) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->orders->releaseDueOrders($user->id);

        return response()->json([
            'commission_profile' => self::formatProfile($user->commissionArtistProfile),
            'categories' => CommissionCategory::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'services' => CommissionService::query()
                ->select('commission_services.*')
                ->selectSub($this->activeServiceBoostSubquery(), 'boosted_until')
                ->where('user_id', $user->id)
                ->with('category:id,name,slug')
                ->latest()
                ->get()
                ->map(fn(CommissionService $service) => $this->formatService($service))
                ->values(),
            'orders' => CommissionOrder::query()
                ->where('artist_id', $user->id)
                ->with([
                    'service:id,title,slug,image_path',
                    'customer:id,name,username,avatar',
                    'revisions.requester:id,name,username,avatar',
                    'deliveryFiles.uploader:id,name,username,avatar',
                ])
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn(CommissionOrder $order) => $this->formatOrder($order))
                ->values(),
            'ratings' => CommissionRating::query()
                ->where('artist_id', $user->id)
                ->with(['service:id,title,slug', 'customer:id,name,username,avatar'])
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn(CommissionRating $rating) => \App\Http\Controllers\Api\CommissionAccountController::formatRating($rating))
                ->values(),
            'widgets' => $this->widgets($user->id),
        ]);
    }

    public function storeService(Request $request): JsonResponse
    {
        $this->ensureApproved($request);
        $validated = $this->validateService($request);
        $validated['min_price_credits'] = (int) $validated['base_price_credits'];
        $validated['slug'] = CommissionService::generateSlug($validated['title']);
        $validated['user_id'] = $request->user()->id;
        $validated['image_path'] = $this->storeImage($request);

        $service = CommissionService::create($validated);

        return response()->json($this->formatService($service->load('category')), 201);
    }

    public function updateService(Request $request, CommissionService $service): JsonResponse
    {
        $this->ensureOwner($request, $service);
        $this->ensureApproved($request);

        $validated = $this->validateService($request, false);
        if (array_key_exists('base_price_credits', $validated)) {
            $validated['min_price_credits'] = (int) $validated['base_price_credits'];
        }
        if (isset($validated['title']) && $validated['title'] !== $service->title) {
            $validated['slug'] = CommissionService::generateSlug($validated['title'], $service->id);
        }

        $imagePath = $this->storeImage($request);
        if ($imagePath) {
            if ($service->image_path) {
                Storage::disk('public')->delete($service->image_path);
            }
            $validated['image_path'] = $imagePath;
        }

        $service->update($validated);

        return response()->json($this->formatService($service->fresh()->load('category')));
    }

    public function destroyService(Request $request, CommissionService $service): JsonResponse
    {
        $this->ensureOwner($request, $service);
        $service->delete();

        return response()->json(['message' => 'Commission service deleted.']);
    }

    public function updateOrder(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->artist_id === $request->user()->id, 404);

        $validated = $request->validate([
            'status' => ['required', 'in:in_progress,delivered,cancelled,disputed'],
        ]);

        $updates = ['status' => $validated['status']];
        if ($validated['status'] === 'in_progress' && ! $order->accepted_at) {
            $updates['accepted_at'] = now();
        }
        if ($validated['status'] === 'delivered') {
            $updates['delivered_at'] = now();
            $updates['auto_release_at'] = now()->addDays(5);
        }
        if ($validated['status'] === 'cancelled') {
            $order = $this->orders->refund($order);

            return response()->json([
                'message' => 'Commission order cancelled and eligible escrow was refunded.',
                'order' => $this->formatOrder($order->fresh(['service', 'customer'])),
            ]);
        }
        if ($validated['status'] === 'disputed') {
            $updates['disputed_at'] = now();
        }

        $order->update($updates);
        if ($validated['status'] === 'disputed') {
            $this->createDisputeTicket($request->user()->id, $order, 'Artist disputed commission order.');
        }

        return response()->json([
            'message' => 'Commission order updated.',
            'order' => $this->formatOrder($order->fresh(['service', 'customer'])),
        ]);
    }

    public function archiveOrder(Request $request, CommissionOrder $order): JsonResponse
    {
        $order = $this->orders->archive($order, $request->user());

        return response()->json([
            'message' => 'Commission archived.',
            'order' => $this->formatOrder($order->fresh(['service', 'customer'])),
        ]);
    }

    public function quoteOrder(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->artist_id === $request->user()->id, 404);

        $validated = $request->validate([
            'quote_credits' => ['required', 'integer', 'min:0', 'max:999999'],
            'quote_note' => ['nullable', 'string', 'max:2000'],
            'flow' => ['nullable', 'array', 'max:20'],
            'flow.*.type' => ['required_with:flow', 'string', 'max:40'],
            'flow.*.label' => ['required_with:flow', 'string', 'max:120'],
            'flow.*.percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'flow.*.rounds' => ['nullable', 'integer', 'min:0', 'max:50'],
        ]);

        $order = $this->orders->sendQuote(
            $order,
            $request->user(),
            (int) $validated['quote_credits'],
            $validated['flow'] ?? ($order->flow_snapshot ?? []),
            $validated['quote_note'] ?? null,
        );

        return response()->json([
            'message' => 'Commission quote sent.',
            'order' => $this->formatOrder($order),
        ]);
    }

    public function advanceOrderStage(Request $request, CommissionOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'step_index' => ['required', 'integer', 'min:0', 'max:100'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $order = $this->orders->advanceStage(
            $order,
            $request->user(),
            (int) $validated['step_index'],
            $validated['note'] ?? null,
        );

        return response()->json([
            'message' => 'Commission stage updated.',
            'order' => $this->formatOrder($order),
        ]);
    }

    public function updateRevision(Request $request, CommissionRevision $revision): JsonResponse
    {
        $revision->loadMissing('order');
        abort_unless($revision->order?->artist_id === $request->user()->id, 404);

        $validated = $request->validate([
            'status' => ['required', 'in:in_progress,resolved,rejected'],
            'artist_response' => ['nullable', 'string', 'max:2000'],
        ]);

        $revision->update([
            'status' => $validated['status'],
            'artist_response' => $validated['artist_response'] ?? $revision->artist_response,
            'resolved_at' => in_array($validated['status'], ['resolved', 'rejected'], true) ? now() : null,
        ]);

        return response()->json([
            'message' => 'Revision updated.',
            'revision' => \App\Http\Controllers\Api\CommissionAccountController::formatRevision($revision->fresh('requester')),
        ]);
    }

    public function uploadDeliveryFile(Request $request, CommissionOrder $order): JsonResponse
    {
        abort_unless($order->artist_id === $request->user()->id, 404);
        abort_if(in_array($order->status, ['completed', 'cancelled'], true), 422, 'This commission can no longer receive delivery files.');

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif,pdf,zip,rar,psd,clip', 'max:51200'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $uploaded = $request->file('file');
        $path = $uploaded->store("commission-deliveries/{$order->id}", 'public');
        $previewPath = null;
        if (str_starts_with((string) $uploaded->getClientMimeType(), 'image/')) {
            $previewPath = "commission-deliveries/{$order->id}/previews/" . pathinfo($path, PATHINFO_FILENAME) . '.' . (pathinfo($path, PATHINFO_EXTENSION) ?: 'jpg');
            $this->watermarks->createDisplayCopy(
                Storage::disk('public')->path($path),
                $previewPath,
                true,
                'final_delivery',
            );
        }

        $file = CommissionDeliveryFile::create([
            'commission_order_id' => $order->id,
            'uploaded_by' => $request->user()->id,
            'file_path' => $path,
            'preview_path' => $previewPath,
            'original_name' => $uploaded->getClientOriginalName(),
            'mime_type' => $uploaded->getClientMimeType(),
            'size_bytes' => $uploaded->getSize() ?: 0,
            'note' => $validated['note'] ?? null,
            'moderation_status' => 'pending',
        ]);

        if ($order->status !== 'delivered') {
            $order->update([
                'status' => 'delivered',
                'delivered_at' => now(),
                'auto_release_at' => now()->addDays(5),
            ]);
        }

        return response()->json([
            'message' => 'Final delivery file uploaded for moderation.',
            'delivery_file' => \App\Http\Controllers\Api\CommissionAccountController::formatDeliveryFile($file->load('uploader')),
            'order' => $this->formatOrder($order->fresh(['service', 'customer', 'revisions.requester', 'deliveryFiles.uploader'])),
        ], 201);
    }

    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'application_reason' => ['required', 'string', 'min:20', 'max:1000'],
        ]);

        $profile = CommissionArtistProfile::firstOrNew(['user_id' => $request->user()->id]);

        if (in_array($profile->application_status, ['pending', 'approved', 'suspended'], true)) {
            return response()->json([
                'message' => 'Your commission application is already active.',
                'commission_profile' => $this->formatProfile($profile),
            ], 422);
        }

        $profile->fill([
            'application_status' => 'pending',
            'commissions_enabled' => false,
            'commission_status' => 'closed',
            'application_reason' => $validated['application_reason'],
            'terms_moderation_status' => 'pending',
        ]);
        $profile->save();

        return response()->json([
            'message' => 'Commission application submitted for admin review.',
            'commission_profile' => $this->formatProfile($profile),
        ]);
    }

    public function appealRating(Request $request, CommissionRating $rating): JsonResponse
    {
        abort_unless($rating->artist_id === $request->user()->id, 404);
        abort_unless($rating->status === 'published', 422, 'Only published ratings can be appealed.');

        $validated = $request->validate([
            'appeal_reason' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $rating->update([
            'status' => 'appealed',
            'appeal_reason' => $validated['appeal_reason'],
            'appealed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Rating appeal sent to admin.',
            'rating' => \App\Http\Controllers\Api\CommissionAccountController::formatRating($rating->fresh(['service', 'customer'])),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $profile = CommissionArtistProfile::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['application_status' => 'not_applied']
        );

        if ($profile->application_status !== 'approved') {
            return response()->json([
                'message' => 'Your commission application must be approved before enabling commissions.',
                'commission_profile' => $this->formatProfile($profile),
            ], 403);
        }

        $validated = $request->validate([
            'commissions_enabled' => ['sometimes', 'boolean'],
            'commission_status' => ['sometimes', 'in:open,waitlist,closed'],
            'terms' => ['nullable', 'string', 'max:3000'],
        ]);

        if (array_key_exists('terms', $validated) && $validated['terms'] !== $profile->terms) {
            $validated['terms_moderation_status'] = 'pending';
        }

        $profile->update($validated);

        return response()->json([
            'message' => 'Commission settings updated.',
            'commission_profile' => $this->formatProfile($profile),
        ]);
    }

    public static function formatProfile(?CommissionArtistProfile $profile): array
    {
        if (! $profile) {
            return [
                'application_status' => 'not_applied',
                'commissions_enabled' => false,
                'commission_status' => 'closed',
                'application_reason' => null,
                'terms' => null,
                'terms_moderation_status' => 'approved',
                'customers_count' => 0,
                'average_rating' => 0,
                'ratings_count' => 0,
            ];
        }

        return [
            'id' => $profile->id,
            'application_status' => $profile->application_status,
            'commissions_enabled' => (bool) $profile->commissions_enabled,
            'commission_status' => $profile->commission_status,
            'application_reason' => $profile->application_reason,
            'terms' => $profile->terms,
            'terms_moderation_status' => $profile->terms_moderation_status,
            'customers_count' => (int) $profile->customers_count,
            'average_rating' => (float) $profile->average_rating,
            'ratings_count' => (int) $profile->ratings_count,
        ];
    }

    private function ensureApproved(Request $request): void
    {
        $profile = $request->user()->commissionArtistProfile;
        abort_unless($profile?->application_status === 'approved', 403, 'Commission access must be approved first.');
    }

    private function ensureOwner(Request $request, CommissionService $service): void
    {
        abort_unless($service->user_id === $request->user()->id, 404);
    }

    private function validateService(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'commission_category_id' => ['nullable', 'exists:commission_categories,id'],
            'description' => ['nullable', 'string', 'max:3000'],
            'image' => [$creating ? 'nullable' : 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'base_price_credits' => ['required', 'integer', 'min:0', 'max:999999'],
            'min_price_credits' => ['nullable', 'integer', 'min:0', 'max:999999'],
            'delivery_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'slots_available' => ['nullable', 'integer', 'min:0', 'max:999'],
            'status' => ['required', 'in:open,waitlist,closed,paused'],
            'is_published' => ['sometimes', 'boolean'],
            'terms' => ['nullable', 'string', 'max:3000'],
            'quote_rules' => ['nullable', 'string', 'max:3000'],
            'refund_policy' => ['nullable', 'string', 'max:3000'],
            'required_references' => ['nullable', 'string', 'max:3000'],
            'request_questions' => ['nullable', 'array', 'max:50'],
            'request_questions.*.id' => ['nullable', 'string', 'max:80'],
            'request_questions.*.title' => ['nullable', 'string', 'max:500'],
            'request_questions.*.description' => ['nullable', 'string', 'max:1000'],
            'request_questions.*.type' => ['nullable', 'string', 'max:40'],
            'request_questions.*.required' => ['nullable', 'boolean'],
            'request_questions.*.options' => ['nullable', 'array', 'max:20'],
            'request_questions.*.options.*' => ['nullable', 'string', 'max:300'],
            'info_questions' => ['nullable', 'array', 'max:50'],
            'info_questions.*.id' => ['nullable', 'string', 'max:80'],
            'info_questions.*.question' => ['nullable', 'string', 'max:500'],
            'info_questions.*.answer' => ['nullable', 'string', 'max:3000'],
            'client_fields' => ['nullable', 'array'],
            'client_fields.name.collect' => ['nullable', 'boolean'],
            'client_fields.name.required' => ['nullable', 'boolean'],
            'client_fields.nickname.collect' => ['nullable', 'boolean'],
            'client_fields.nickname.required' => ['nullable', 'boolean'],
            'client_fields.email.collect' => ['nullable', 'boolean'],
            'client_fields.email.required' => ['nullable', 'boolean'],
            'client_fields.discord.collect' => ['nullable', 'boolean'],
            'client_fields.discord.required' => ['nullable', 'boolean'],
            'client_fields.twitter.collect' => ['nullable', 'boolean'],
            'client_fields.twitter.required' => ['nullable', 'boolean'],
            'client_fields.instagram.collect' => ['nullable', 'boolean'],
            'client_fields.instagram.required' => ['nullable', 'boolean'],
            'client_fields.facebook.collect' => ['nullable', 'boolean'],
            'client_fields.facebook.required' => ['nullable', 'boolean'],
            'client_fields.tiktok.collect' => ['nullable', 'boolean'],
            'client_fields.tiktok.required' => ['nullable', 'boolean'],
            'promo_discounts' => ['nullable', 'array', 'max:20'],
            'promo_discounts.*.id' => ['nullable', 'string', 'max:80'],
            'promo_discounts.*.label' => ['nullable', 'string', 'max:120'],
            'promo_discounts.*.type' => ['nullable', 'in:percent,fixed'],
            'promo_discounts.*.amount' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'promo_discounts.*.starts_at' => ['nullable', 'date'],
            'promo_discounts.*.ends_at' => ['nullable', 'date'],
            'promo_discounts.*.active' => ['nullable', 'boolean'],
            'setup_options' => ['nullable', 'array'],
            'setup_options.visibility' => ['nullable', 'in:discoverable,hidden'],
            'setup_options.service_type' => ['nullable', 'in:custom,personalized'],
            'setup_options.communication_style' => ['nullable', 'in:open,surprise'],
            'setup_options.requesting_process' => ['nullable', 'in:custom_proposal,instant_order'],
            'setup_options.notify_followers_on_status_change' => ['nullable', 'boolean'],
            'setup_options.sensitive' => ['nullable', 'boolean'],
            'setup_options.display_service_stats' => ['nullable', 'boolean'],
            'setup_options.estimated_start' => ['nullable', 'string', 'max:80'],
            'setup_options.start_time' => ['nullable', 'date_format:H:i'],
            'setup_options.end_time' => ['nullable', 'date_format:H:i'],
            'setup_options.guaranteed_delivery_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'flow' => ['nullable', 'array', 'max:20'],
            'flow.*.type' => ['required_with:flow', 'string', 'max:40'],
            'flow.*.label' => ['required_with:flow', 'string', 'max:120'],
            'flow.*.percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'flow.*.rounds' => ['nullable', 'integer', 'min:0', 'max:50'],
        ]);
    }

    private function storeImage(Request $request): ?string
    {
        if (! $request->hasFile('image')) {
            return null;
        }

        return $request->file('image')->store("commissions/{$request->user()->id}", 'public');
    }

    private function formatService(CommissionService $service): array
    {
        return [
            'id' => $service->id,
            'title' => $service->title,
            'slug' => $service->slug,
            'description' => $service->description,
            'image_path' => $service->image_path,
            'base_price_credits' => (int) $service->base_price_credits,
            'min_price_credits' => (int) $service->base_price_credits,
            'delivery_days' => $service->delivery_days,
            'slots_available' => $service->slots_available,
            'status' => $service->status,
            'flow' => $service->flow ?? [],
            'terms' => $service->terms,
            'quote_rules' => $service->quote_rules,
            'refund_policy' => $service->refund_policy,
            'required_references' => $service->required_references,
            'request_questions' => $service->request_questions ?? [],
            'info_questions' => $service->info_questions ?? [],
            'client_fields' => $this->clientFields($service),
            'promo_discounts' => $service->promo_discounts ?? [],
            'setup_options' => $this->setupOptions($service),
            'is_published' => (bool) $service->is_published,
            'boosted_until' => $service->boosted_until ?? null,
            'is_featured' => (bool) ($service->is_featured ?? false),
            'category' => $service->category ? [
                'id' => $service->category->id,
                'name' => $service->category->name,
                'slug' => $service->category->slug,
            ] : null,
            'commission_category_id' => $service->commission_category_id,
            'created_at' => $service->created_at,
            'updated_at' => $service->updated_at,
        ];
    }

    private function activeServiceBoostSubquery()
    {
        return FeatureBoost::query()
            ->selectRaw('MAX(ends_at)')
            ->whereColumn('target_id', 'commission_services.id')
            ->where('target_type', 'commission_service')
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now());
    }

    private function formatOrder(CommissionOrder $order): array
    {
        return [
            'id' => $order->id,
            'status' => $order->status,
            'request_message' => $order->request_message,
            'reference_notes' => $order->reference_notes,
            'request_answers' => $order->request_answers ?? [],
            'client_details' => $order->client_details ?? [],
            'quote_credits' => $order->quote_credits,
            'quote_note' => $order->quote_note,
            'credits_checked' => $order->credits_checked,
            'escrow_credits' => $order->escrow_credits,
            'released_credits' => $order->released_credits,
            'refunded_credits' => $order->refunded_credits,
            'flow_snapshot' => $order->flow_snapshot ?? [],
            'paid_steps' => $order->paid_steps ?? [],
            'stage_notes' => $order->stage_notes ?? [],
            'stage_attempts_used' => $order->stage_attempts_used ?? [],
            'current_step_index' => $order->current_step_index,
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
            'created_at' => $order->created_at,
            'revision_limit' => \App\Http\Controllers\Api\CommissionAccountController::revisionLimit($order),
            'revisions' => $order->relationLoaded('revisions')
                ? $order->revisions->map(fn(CommissionRevision $revision) => \App\Http\Controllers\Api\CommissionAccountController::formatRevision($revision))->values()
                : [],
            'delivery_files' => $order->relationLoaded('deliveryFiles')
                ? $order->deliveryFiles->map(fn(CommissionDeliveryFile $file) => \App\Http\Controllers\Api\CommissionAccountController::formatDeliveryFile($file))->values()
                : [],
            'service' => $order->service ? [
                'id' => $order->service->id,
                'title' => $order->service->title,
                'slug' => $order->service->slug,
                'image_path' => $order->service->image_path,
            ] : null,
            'customer' => $order->customer ? [
                'id' => $order->customer->id,
                'name' => $order->customer->name,
                'username' => $order->customer->username,
                'avatar' => $order->customer->avatar,
            ] : null,
        ];
    }

    private function widgets(string $userId): array
    {
        $orders = CommissionOrder::query()->where('artist_id', $userId);
        $earnings = EarningTransaction::query()->where('storyteller_id', $userId);

        return [
            'total_orders' => (clone $orders)->count(),
            'active_orders' => (clone $orders)->whereIn('status', ['requested', 'quoted', 'awaiting_payment', 'in_progress', 'delivered', 'disputed'])->count(),
            'completed_orders' => (clone $orders)->where('status', 'completed')->count(),
            'commission_earnings' => (float) (clone $earnings)->where('source', 'commission_release')->sum('storyteller_cut'),
            'works_earnings' => (float) (clone $earnings)->where('source', 'chapter_unlock')->sum('storyteller_cut'),
            'arts_earnings' => (float) (clone $earnings)->where('source', 'art_download')->sum('storyteller_cut'),
            'super_like_earnings' => (float) (clone $earnings)->where('source', 'super_like')->sum('storyteller_cut'),
            'combined_creator_earnings' => (float) (clone $earnings)->sum('storyteller_cut'),
        ];
    }

    private function clientFields(CommissionService $service): array
    {
        return array_replace_recursive([
            'name' => ['collect' => true, 'required' => false],
            'nickname' => ['collect' => true, 'required' => false],
            'email' => ['collect' => false, 'required' => false],
            'discord' => ['collect' => false, 'required' => false],
            'twitter' => ['collect' => false, 'required' => false],
            'instagram' => ['collect' => false, 'required' => false],
            'facebook' => ['collect' => false, 'required' => false],
            'tiktok' => ['collect' => false, 'required' => false],
        ], $service->client_fields ?? []);
    }

    private function setupOptions(CommissionService $service): array
    {
        return array_replace([
            'visibility' => 'discoverable',
            'service_type' => 'custom',
            'communication_style' => 'open',
            'requesting_process' => 'custom_proposal',
            'notify_followers_on_status_change' => false,
            'sensitive' => false,
            'display_service_stats' => true,
            'estimated_start' => 'this_month',
            'start_time' => '',
            'end_time' => '',
            'guaranteed_delivery_days' => $service->delivery_days,
        ], $service->setup_options ?? []);
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
