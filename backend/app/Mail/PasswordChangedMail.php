<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** A security notice: the password of this account was just changed. Always sent, whatever the person's email settings. */
class PasswordChangedMail extends Mailable
{
    public function __construct(public readonly string $employeeId) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Eljin Employee Portal password was changed');
    }

    public function content(): Content
    {
        $base = rtrim((string) config('app.frontend_url'), '/');

        return new Content(view: 'mail.password-changed', text: 'mail.text.password-changed', with: ['employeeId' => $this->employeeId, 'resetUrl' => $base.'/login', 'when' => now()->timezone('Asia/Manila')->format('F j, Y \a\t g:i A').' (Philippine time)']);
    }
}
