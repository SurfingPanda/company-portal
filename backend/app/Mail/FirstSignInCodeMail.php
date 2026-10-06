<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** The 6-digit code that proves the person owns the mailbox when they set their password at their first sign-in. */
class FirstSignInCodeMail extends Mailable
{
    public function __construct(public readonly string $employeeId, public readonly string $code, public readonly int $minutes) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Eljin Employee Portal verification code');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.first-sign-in-code', text: 'mail.text.first-sign-in-code', with: ['minutes' => $this->minutes]);
    }
}
