<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\View;
use Throwable;

class NotificationEmailService
{
    /**
     * Sends through Laravel mail. A notification override can route every
     * notification email to one inbox while preserving the real app recipient.
     */
    public function send(
        User|string $recipient,
        string $subject,
        array $lines = [],
        ?string $template = null,
        array $data = []
    ): void
    {
        $originalEmail = $recipient instanceof User ? $recipient->email : $recipient;
        $name = $recipient instanceof User ? $recipient->name : null;
        $email = config('mail.notification_override') ?: $originalEmail;
        $view = $this->templateView($template);
        $body = collect($lines)->filter()->implode(PHP_EOL);
        $payload = array_merge([
            'subject' => $subject,
            'title' => $subject,
            'lines' => array_values(array_filter($lines)),
            'body' => $body,
            'recipientName' => $name,
            'originalEmail' => $originalEmail,
            'actionUrl' => null,
            'actionLabel' => 'Open LaternComix',
        ], $data);
        $payload['actionUrl'] = $this->absoluteUrl($payload['actionUrl'] ?? null);

        Log::info('Notification email queued', [
            'to' => $email,
            'original_to' => $originalEmail,
            'name' => $name,
            'subject' => $subject,
            'template' => $view,
        ]);

        try {
            Mail::send($view, $payload, function ($message) use ($email, $name, $subject) {
                $message->to($email, $name)->subject($subject);
            });

            Log::info('Notification email sent', [
                'to' => $email,
                'original_to' => $originalEmail,
                'subject' => $subject,
                'template' => $view,
            ]);
        } catch (Throwable $exception) {
            Log::error('Notification email failed', [
                'to' => $email,
                'original_to' => $originalEmail,
                'subject' => $subject,
                'template' => $view,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function sendToAdmins(string $subject, array $lines = []): void
    {
        User::query()
            ->where('role', 'super_admin')
            ->select(['id', 'name', 'email'])
            ->chunkById(50, function ($admins) use ($subject, $lines) {
                foreach ($admins as $admin) {
                    $this->send($admin, $subject, $lines);
                }
            });
    }

    private function templateView(?string $template): string
    {
        $view = $template ? "emails.notifications.{$template}" : 'emails.notifications.generic';

        return View::exists($view) ? $view : 'emails.notifications.generic';
    }

    private function absoluteUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $url)) {
            return $url;
        }

        return rtrim((string) config('app.url'), '/') . '/' . ltrim($url, '/');
    }
}
