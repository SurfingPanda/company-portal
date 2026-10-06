<?php

namespace App\Mail;

use App\Models\User;
use App\Services\DigestBuilder;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;

/** The morning summary: what needs the person, what is new, and today's celebrations. */
class DailyDigestMail extends Mailable
{
    /** @param  array<string, mixed>  $digest  from DigestBuilder::for() */
    public function __construct(public readonly User $user, public readonly array $digest, public readonly bool $preview = false) {}

    private function frontend(): string
    {
        return rtrim((string) config('app.frontend_url'), '/');
    }

    public function envelope(): Envelope
    {
        $subject = DigestBuilder::isEmpty($this->digest) ? 'Your daily summary' : 'Your daily summary: '.rtrim(DigestBuilder::summary($this->digest), '.');

        return new Envelope(subject: ($this->preview ? '[Preview] ' : '').$subject);
    }

    public function headers(): Headers
    {
        return new Headers(text: ['List-Unsubscribe' => '<'.$this->frontend().'/account/settings>', 'X-Auto-Response-Suppress' => 'All']);
    }

    public function content(): Content
    {
        $entry = $this->user->directoryEntry;
        $name = trim(explode(' ', (string) ($this->user->profile?->preferred_name ?: $entry?->display_name ?: ''))[0]) ?: ucfirst(explode('.', explode('@', $this->user->email)[0])[0]);

        return new Content(view: 'mail.daily-digest', text: 'mail.text.daily-digest', with: [
            'digest' => $this->digest, 'name' => $name, 'summary' => DigestBuilder::summary($this->digest), 'preview' => $this->preview,
            'date' => now()->timezone('Asia/Manila')->format('l, F j, Y'), 'portalUrl' => $this->frontend(), 'settingsUrl' => $this->frontend().'/account/settings',
        ]);
    }
}
