<?php

namespace App\Console\Commands;

use App\Mail\SubscriptionConfirmed;
use App\Services\NotificationEmailService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendSampleMail extends Command
{
    /**
     * Supported sample email templates.
     */
    private const SUPPORTED_TEMPLATES = [
        'generic',
        'welcome-artist',
        'welcome-wanderer',
        'subscription-confirmed',
    ];

    /**
     * The name and signature of the console command.
     */
    protected $signature = 'mail:sample
        {template : generic, welcome-artist, welcome-wanderer, or subscription-confirmed}
        {--to=hajarguiamatgabuya@yahoo.com : Email address that receives the sample}';

    /**
     * The console command description.
     */
    protected $description = 'Send a sample LaternComix notification email.';

    /**
     * Execute the console command.
     */
    public function handle(NotificationEmailService $emails): int
    {
        $template = strtolower(trim((string) $this->argument('template')));
        $to = trim((string) $this->option('to'));

        if (! in_array($template, self::SUPPORTED_TEMPLATES, true)) {
            $this->error(
                'Unknown sample email template: ' . $template
            );

            $this->line(
                'Available templates: ' . implode(', ', self::SUPPORTED_TEMPLATES)
            );

            return self::FAILURE;
        }

        if (! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $this->error("The email address '{$to}' is not valid.");

            return self::FAILURE;
        }

        try {
            switch ($template) {
                case 'generic':
                    $this->sendGenericSample($emails, $to);
                    break;

                case 'welcome-artist':
                    $this->sendWelcomeArtistSample($emails, $to);
                    break;

                case 'welcome-wanderer':
                    $this->sendWelcomeWandererSample($emails, $to);
                    break;

                case 'subscription-confirmed':
                    $this->sendSubscriptionConfirmedSample($to);
                    break;
            }
        } catch (Throwable $exception) {
            $this->error('The sample email could not be sent.');
            $this->newLine();

            $this->line(
                '<fg=red>' . $exception->getMessage() . '</>'
            );

            return self::FAILURE;
        }

        $this->newLine();

        $this->info(
            "Sent the '{$template}' sample email to {$to}."
        );

        return self::SUCCESS;
    }

    /**
     * Send a generic notification sample.
     */
    private function sendGenericSample(
        NotificationEmailService $emails,
        string $to
    ): void {
        $emails->send(
            $to,
            'Sample LaternComix Notification',
            [
                'This is a preview of a general LaternComix notification.',
                'The shared layout can be used for account updates, announcements, security alerts, moderation notices, payment updates, and other platform notifications.',
                'The individual notification template controls the content displayed inside the email.',
            ],
            'generic',
            [
                'preheader' => 'You have a new notification from LaternComix.',

                'eyebrow' => 'LaternComix Notification',

                'subtitle' => 'Here is an important update related to your LaternComix account.',

                'actionUrl' => url('/'),

                'actionLabel' => 'Visit LaternComix',
            ]
        );
    }

    /**
     * Send a welcome email for an artist or creator.
     */
    private function sendWelcomeArtistSample(
        NotificationEmailService $emails,
        string $to
    ): void {
        $emails->send(
            $to,
            'Welcome to LaternComix Studio',
            [],
            'welcome-artist',
            [
                'recipientName' => 'Storyteller',

                'preheader' => 'Your LaternComix creator journey starts here.',

                'eyebrow' => 'Creator Welcome',

                'subtitle' => 'Your creator account is ready. Start building your profile and publishing your work.',

                'actionUrl' => url('/studio'),

                'actionLabel' => 'Open Studio',
            ]
        );
    }

    /**
     * Send a welcome email for a reader.
     */
    private function sendWelcomeWandererSample(
        NotificationEmailService $emails,
        string $to
    ): void {
        $emails->send(
            $to,
            'Welcome to LaternComix',
            [],
            'welcome-wanderer',
            [
                'recipientName' => 'Wanderer',

                'preheader' => 'Welcome to the LaternComix community.',

                'eyebrow' => 'Reader Welcome',

                'subtitle' => 'Discover serialized comics, graphic narratives, original artwork, and independent creators.',

                'actionUrl' => url('/'),

                'actionLabel' => 'Explore LaternComix',
            ]
        );
    }

    /**
     * Send a subscription confirmation sample.
     */
    private function sendSubscriptionConfirmedSample(string $to): void
    {
        Mail::to($to)->send(
            new SubscriptionConfirmed()
        );
    }
}
