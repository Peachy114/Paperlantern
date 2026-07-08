<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SubscriptionConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    public function build()
    {
        return $this->subject('You are subscribed to Laterncomix!')
            ->view('emails.subscription-confirmed');
    }
}