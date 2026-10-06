<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** The one-time "choose your password" email (account activation or reset). */
class PasswordLinkMail extends Mailable
{
    public function __construct(public readonly string $purpose, public readonly string $employeeId, public readonly string $url, public readonly int $hours) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->purpose === 'activation' ? 'Activate your Eljin Employee Portal account' : 'Reset your Eljin Employee Portal password');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.password-link', text: 'mail.text.password-link');
    }
}
