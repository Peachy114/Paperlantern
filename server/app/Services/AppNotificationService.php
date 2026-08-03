<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AppNotificationService
{
    public const READER_CATEGORIES = [
        'new_chapter',
        'new_episode',
        'new_volume',
        'return_from_hiatus',
        'work_completed',
        'creator_announcement',
        'early_access_release',
        'subscription_renewal',
        'comment_reply',
        'creator_liked_comment',
        'likes',
        'messages',
        'commissions',
    ];

    public const CREATOR_CATEGORIES = [
        'new_comment',
        'new_review',
        'new_follower',
        'new_supporter',
        'new_purchase',
        'failed_scheduled_release',
        'collaborator_update',
        'moderation_action',
        'copyright_report',
        'payout_update',
        'likes',
        'messages',
        'commissions',
        'creator_announcement',
    ];

    private const SECTION_CATEGORIES = [
        'messages' => ['messages'],
        'commissions' => ['commissions'],
        'shop' => ['new_purchase', 'new_review', 'shop_update'],
        'comments' => ['comment_reply', 'new_comment', 'creator_liked_comment'],
        'earnings' => ['payout_update', 'new_supporter'],
        'arts' => ['likes', 'new_comment'],
        'announcements' => ['creator_announcement', 'moderation_action', 'copyright_report'],
        'releases' => [
            'new_chapter',
            'new_episode',
            'new_volume',
            'return_from_hiatus',
            'work_completed',
            'early_access_release',
        ],
    ];

    public function __construct(private NotificationEmailService $emails) {}

    public function preferences(User $user): NotificationPreference
    {
        return NotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            [
                'reader_categories' => self::READER_CATEGORIES,
                'creator_categories' => self::CREATOR_CATEGORIES,
                'in_app_enabled' => true,
                'email_enabled' => true,
                'push_enabled' => false,
                'digest_enabled' => false,
                'digest_frequency' => 'daily',
            ]
        );
    }

    public function notify(
        User $user,
        string $category,
        string $title,
        ?string $body = null,
        ?string $actionUrl = null,
        array $meta = []
    ): ?AppNotification {
        $preferences = $this->preferences($user);

        if (! $this->categoryEnabled($user, $preferences, $category)) {
            return null;
        }

        $skipEmail = (bool) ($meta['skip_email'] ?? false);
        unset($meta['skip_email']);
        $meta['section'] ??= self::sectionForCategory($category);

        Log::info('LanternPaper notification', [
            'to' => $user->email,
            'user_id' => $user->id,
            'category' => $category,
            'title' => $title,
            'action_url' => $actionUrl,
        ]);

        $notification = null;

        if ($preferences->in_app_enabled) {
            $notification = AppNotification::create([
                'user_id' => $user->id,
                'category' => $category,
                'title' => $title,
                'body' => $body,
                'action_url' => $actionUrl,
                'meta' => $meta,
            ]);
        }

        if (! $skipEmail && $preferences->email_enabled && ! $preferences->digest_enabled) {
            $this->emails->send(
                $user,
                $title,
                array_filter([$body]),
                $meta['email_template'] ?? null,
                [
                    'category' => $category,
                    'actionUrl' => $actionUrl,
                    'actionLabel' => $meta['email_action_label'] ?? 'Open LanternComix',
                ]
            );
        }

        if (! $skipEmail && $preferences->digest_enabled) {
            Log::info('LanternPaper notification queued for digest', [
                'user_id' => $user->id,
                'category' => $category,
                'frequency' => $preferences->digest_frequency,
            ]);
        }

        return $notification;
    }

    public function welcome(User $user): void
    {
        if ($user->role === 'storyteller') {
            $this->notify(
                $user,
                'creator_announcement',
                'Welcome to LanternPaper Studio',
                'Your artist account is ready. You can create works, publish chapters, receive comments, and grow your audience.',
                '/studio',
                [
                    'email_template' => 'welcome-artist',
                    'email_action_label' => 'Open Studio',
                ]
            );
            return;
        }

        $this->notify(
            $user,
            'creator_announcement',
            'Welcome to LanternPaper',
            'Your reader account is ready. Discover stories, follow creators, comment, and save your favorites.',
            '/',
            [
                'email_template' => 'welcome-wanderer',
                'email_action_label' => 'Start Reading',
            ]
        );
    }

    public static function sectionForCategory(string $category): ?string
    {
        foreach (self::SECTION_CATEGORIES as $section => $categories) {
            if (in_array($category, $categories, true)) return $section;
        }
        return null;
    }

    public static function categoriesForSection(string $section): array
    {
        return self::SECTION_CATEGORIES[$section] ?? [];
    }

    private function categoryEnabled(User $user, NotificationPreference $preferences, string $category): bool
    {
        $categories = array_values(array_unique(array_merge(
            $preferences->reader_categories ?? self::READER_CATEGORIES,
            $preferences->creator_categories ?? self::CREATOR_CATEGORIES,
        )));

        return in_array($category, $categories, true);
    }
}
