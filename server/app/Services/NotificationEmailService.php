<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class NotificationEmailService
{
    /**
     * Sends through Laravel mail. In local/testing this is logged by MAIL_MAILER=log.
     */
    public function send(User|string $recipient, string $subject, array $lines = []): void
    {
        $email = $recipient instanceof User ? $recipient->email : $recipient;
        $name = $recipient instanceof User ? $recipient->name : null;
        $body = collect($lines)->filter()->implode(PHP_EOL);

        Log::info('Notification email queued', [
            'to' => $email,
            'name' => $name,
            'subject' => $subject,
        ]);

        try {
            Mail::raw($body, function ($message) use ($email, $name, $subject) {
                $message->to($email, $name)->subject($subject);
            });
        } catch (Throwable $exception) {
            Log::error('Notification email failed', [
                'to' => $email,
                'subject' => $subject,
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
}
