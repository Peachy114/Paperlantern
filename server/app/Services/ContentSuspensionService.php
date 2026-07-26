<?php

namespace App\Services;

use App\Models\Art;
use App\Models\ArtImage;
use App\Models\ArtistProfileBlock;
use App\Models\Chapter;
use App\Models\Comment;
use App\Models\CommissionDeliveryFile;
use App\Models\CommissionMessage;
use App\Models\ContentSuspension;
use App\Models\FeedPostImage;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Violation;
use App\Models\Work;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ContentSuspensionService
{
    public function reviewQueue(): array
    {
        return [
            'works' => Work::query()
                ->with(['user:id,name,username,strike_count,is_suspended', 'activeContentSuspensions'])
                ->where('status', '!=', 'draft')
                ->latest()
                ->limit(30)
                ->get(['id', 'slug', 'title', 'cover', 'banner', 'type', 'status', 'user_id', 'created_at']),
            'chapters' => Chapter::query()
                ->with(['work:id,slug,title,cover,user_id', 'work.user:id,name,username,strike_count,is_suspended', 'activeContentSuspensions'])
                ->where('status', '!=', 'draft')
                ->latest()
                ->limit(30)
                ->get(['id', 'slug', 'work_id', 'title', 'cover', 'order', 'status', 'created_at']),
            'arts' => Art::query()
                ->with(['user:id,name,username,strike_count,is_suspended', 'images.activeContentSuspensions', 'activeContentSuspensions'])
                ->where('status', 'published')
                ->latest()
                ->limit(30)
                ->get(['id', 'slug', 'title', 'image_path', 'user_id', 'status', 'created_at']),
            'profile_blocks' => ArtistProfileBlock::query()
                ->with(['user:id,name,username,strike_count,is_suspended', 'sourceArtImage', 'sourceSticker', 'activeContentSuspensions'])
                ->latest()
                ->limit(30)
                ->get(),
            'comment_images' => Comment::query()
                ->whereNotNull('image_path')
                ->where('image_moderation_status', 'pending')
                ->where('status', 'visible')
                ->with(['user:id,name,username,strike_count,is_suspended', 'commentable'])
                ->latest()
                ->limit(40)
                ->get(['id', 'user_id', 'commentable_type', 'commentable_id', 'body', 'image_path', 'image_moderation_status', 'created_at']),
            'feed_images' => FeedPostImage::query()
                ->where('moderation_status', 'pending')
                ->with(['feedPost:id,user_id,body,status,created_at', 'feedPost.user:id,name,username,strike_count,is_suspended'])
                ->latest()
                ->limit(40)
                ->get(['id', 'feed_post_id', 'image_path', 'moderation_status', 'created_at']),
            'commission_message_images' => CommissionMessage::query()
                ->whereNotNull('image_path')
                ->where('image_moderation_status', 'pending')
                ->with(['sender:id,name,username,strike_count,is_suspended', 'order.service:id,title,slug'])
                ->latest()
                ->limit(40)
                ->get(['id', 'commission_order_id', 'sender_id', 'body', 'image_path', 'image_moderation_status', 'created_at']),
            'commission_delivery_files' => CommissionDeliveryFile::query()
                ->where('moderation_status', 'pending')
                ->with(['uploader:id,name,username,strike_count,is_suspended', 'order.service:id,title,slug'])
                ->latest()
                ->limit(40)
                ->get(['id', 'commission_order_id', 'uploaded_by', 'file_path', 'original_name', 'mime_type', 'size_bytes', 'note', 'moderation_status', 'created_at']),
            'active_suspensions' => ContentSuspension::query()
                ->where('status', 'active')
                ->with(['user:id,name,username,strike_count,is_suspended', 'admin:id,name,username', 'ticket:id,status,subject'])
                ->latest()
                ->limit(50)
                ->get(),
        ];
    }

    public function suspendByType(
        string $type,
        string $id,
        ?string $field,
        string $reason,
        User $admin
    ): array {
        $target = $this->resolveTarget($type, $id);
        $this->validateField($type, $field);

        return $this->suspend($target, $admin, $reason, $field);
    }

    public function suspend(Model $target, User $admin, string $reason, ?string $field = null): array
    {
        return DB::transaction(function () use ($target, $admin, $reason, $field) {
            $owner = $this->ownerFor($target);

            $existing = ContentSuspension::query()
                ->where('target_type', $target::class)
                ->where('target_id', $target->getKey())
                ->where('target_field', $field)
                ->where('status', 'active')
                ->first();

            if ($existing) {
                return [
                    'message' => 'This content is already suspended.',
                    'suspension' => $existing->load('ticket'),
                    'strike' => $owner->strike_count,
                    'suspended_account' => (bool) $owner->is_suspended,
                ];
            }

            $owner->increment('strike_count');
            $owner->refresh();

            $resultedInSuspension = $owner->strike_count >= 3;
            if ($resultedInSuspension && ! $owner->is_suspended) {
                $owner->update([
                    'is_suspended' => true,
                    'suspension_reason' => 'Account suspended after 3 moderation strikes.',
                    'suspended_at' => now(),
                ]);
            }

            $violation = Violation::create([
                'user_id' => $owner->id,
                'admin_id' => $admin->id,
                'target_type' => $target::class,
                'target_id' => $target->getKey(),
                'reason' => $reason,
                'strike_number' => $owner->strike_count,
                'resulted_in_ban' => false,
            ]);

            $suspension = ContentSuspension::create([
                'user_id' => $owner->id,
                'admin_id' => $admin->id,
                'target_type' => $target::class,
                'target_id' => $target->getKey(),
                'target_field' => $field,
                'reason' => $reason,
                'status' => 'active',
                'hidden_at' => now(),
            ]);

            $ticket = $this->createAppealTicket($suspension, $target, $owner, $reason, $owner->strike_count);
            $suspension->update(['ticket_id' => $ticket->id]);

            return [
                'message' => $resultedInSuspension
                    ? 'Content suspended and account suspended after 3 strikes.'
                    : 'Content suspended and appeal ticket created.',
                'suspension' => $suspension->fresh()->load('ticket'),
                'violation' => $violation,
                'strike' => $owner->strike_count,
                'suspended_account' => $resultedInSuspension,
            ];
        });
    }

    public function restore(ContentSuspension $suspension, User $admin): array
    {
        $suspension->update([
            'status' => 'restored',
            'restored_at' => now(),
        ]);

        $suspension->ticket?->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        $suspension->ticket?->replies()->create([
            'user_id' => $admin->id,
            'message' => 'The suspended content has been restored after review.',
            'is_admin' => true,
        ]);

        return [
            'message' => 'Content suspension restored.',
            'suspension' => $suspension->fresh()->load('ticket'),
        ];
    }

    public function isHidden(Model $target, ?string $field = null): bool
    {
        $query = ContentSuspension::query()
            ->where('target_type', $target::class)
            ->where('target_id', $target->getKey())
            ->where('status', 'active');

        $field === null
            ? $query->whereNull('target_field')
            : $query->where('target_field', $field);

        return $query->exists();
    }

    public function maskWork(Work $work): Work
    {
        $fields = $this->activeFields($work);

        if ($fields->contains('cover')) {
            $work->setAttribute('cover', null);
        }

        if ($fields->contains('banner')) {
            $work->setAttribute('banner', null);
        }

        return $work;
    }

    public function maskChapter(Chapter $chapter): Chapter
    {
        $fields = $this->activeFields($chapter);

        if ($fields->contains('cover')) {
            $chapter->setAttribute('cover', null);
        }

        return $chapter;
    }

    public function maskArt(Art $art): Art
    {
        $fields = $this->activeFields($art);

        if ($fields->contains('image_path')) {
            $art->setAttribute('image_path', null);
        }

        if ($art->relationLoaded('images')) {
            $art->setRelation(
                'images',
                $art->images->reject(fn(ArtImage $image) => $this->isHidden($image))->values()
            );
        }

        return $art;
    }

    public function wholeTargetIsVisibleQuery($query): void
    {
        $query->whereDoesntHave('activeContentSuspensions', fn($q) => $q->whereNull('target_field'));
    }

    private function activeFields(Model $target): \Illuminate\Support\Collection
    {
        if (! $target->relationLoaded('activeContentSuspensions')) {
            $target->load('activeContentSuspensions');
        }

        return $target->activeContentSuspensions
            ->pluck('target_field')
            ->filter()
            ->values();
    }

    private function createAppealTicket(
        ContentSuspension $suspension,
        Model $target,
        User $owner,
        string $reason,
        int $strikeCount
    ): Ticket {
        $label = $this->labelFor($target, $suspension->target_field);

        return Ticket::create([
            'user_id' => $owner->id,
            'category' => 'account',
            'subject' => "Content suspended: {$label}",
            'message' => "Your content was suspended and hidden from public view.\n\nReason: {$reason}\nStrike: {$strikeCount}/3\n\nYou can reply here to appeal or ask for details.",
            'status' => 'open',
            'source_type' => ContentSuspension::class,
            'source_id' => $suspension->id,
        ]);
    }

    private function resolveTarget(string $type, string $id): Model
    {
        return match ($type) {
            'work' => Work::whereKey($id)->orWhere('slug', $id)->firstOrFail(),
            'chapter' => Chapter::whereKey($id)->orWhere('slug', $id)->firstOrFail(),
            'art' => Art::whereKey($id)->orWhere('slug', $id)->firstOrFail(),
            'art_image' => ArtImage::findOrFail($id),
            'profile_block' => ArtistProfileBlock::findOrFail($id),
            'comment' => Comment::findOrFail($id),
            'feed_image' => FeedPostImage::findOrFail($id),
            'commission_message' => CommissionMessage::findOrFail($id),
            'commission_delivery_file' => CommissionDeliveryFile::findOrFail($id),
            default => throw ValidationException::withMessages([
                'type' => ['Unsupported moderation target.'],
            ]),
        };
    }

    private function validateField(string $type, ?string $field): void
    {
        $allowed = [
            'work' => [null, 'cover', 'banner'],
            'chapter' => [null, 'cover'],
            'art' => [null, 'image_path'],
            'art_image' => [null],
            'profile_block' => [null],
            'comment' => [null, 'image_path'],
            'feed_image' => [null, 'image_path'],
            'commission_message' => [null, 'image_path'],
            'commission_delivery_file' => [null, 'file_path'],
        ];

        if (! in_array($field, $allowed[$type] ?? [], true)) {
            throw ValidationException::withMessages([
                'field' => ['Unsupported suspension field for this content type.'],
            ]);
        }
    }

    private function ownerFor(Model $target): User
    {
        if ($target instanceof Chapter) {
            $target->loadMissing('work.user');
            return $target->work->user;
        }

        if ($target instanceof ArtImage) {
            $target->loadMissing('art.user');
            return $target->art->user;
        }

        if ($target instanceof CommissionMessage) {
            $target->loadMissing('sender');
            return $target->sender;
        }

        if ($target instanceof FeedPostImage) {
            $target->loadMissing('feedPost.user');
            return $target->feedPost->user;
        }

        if ($target instanceof CommissionDeliveryFile) {
            $target->loadMissing('uploader');
            return $target->uploader;
        }

        $target->loadMissing('user');
        return $target->user;
    }

    private function labelFor(Model $target, ?string $field): string
    {
        $fieldLabel = $field ? " {$field}" : '';

        return match (true) {
            $target instanceof Work => "Work{$fieldLabel} - {$target->title}",
            $target instanceof Chapter => "Chapter{$fieldLabel} - {$target->title}",
            $target instanceof Art => "Art{$fieldLabel} - {$target->title}",
            $target instanceof ArtImage => "Art image - {$target->art?->title}",
            $target instanceof ArtistProfileBlock => "Profile board block",
            $target instanceof Comment => "Comment{$fieldLabel}",
            $target instanceof FeedPostImage => 'Feed image',
            $target instanceof CommissionMessage => "Commission message{$fieldLabel}",
            $target instanceof CommissionDeliveryFile => "Commission delivery file{$fieldLabel}",
            default => 'Content',
        };
    }
}
