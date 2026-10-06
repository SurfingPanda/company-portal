<?php

namespace App\Mail;

use App\Models\PortalNotification;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;

/** One portal notification as an email, for people who chose "instant". */
class NotificationMail extends Mailable
{
    public function __construct(public readonly PortalNotification $notification) {}

    private function frontend(): string
    {
        return rtrim((string) config('app.frontend_url'), '/');
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->notification->title);
    }

    public function headers(): Headers
    {
        return new Headers(text: ['List-Unsubscribe' => '<'.$this->frontend().'/account/settings>', 'X-Auto-Response-Suppress' => 'All']);
    }

    public function content(): Content
    {
        $link = $this->notification->link;
        $with = [
            'type' => $this->notification->type->value, 'title' => $this->notification->title, 'body' => $this->notification->message,
            'url' => $link !== null && preg_match('#^/[A-Za-z0-9/_\-?=&.%]*$#', $link) === 1 ? $this->frontend().$link : null,
            'settingsUrl' => $this->frontend().'/account/settings',
        ];

        return new Content(view: 'mail.notification', text: 'mail.text.notification', with: $with);
    }
}
