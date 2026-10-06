<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Models\EmployeeRequest;
use App\Models\Policy;
use App\Models\PolicyAcknowledgement;
use App\Models\PortalNotification;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * What goes into one person's daily summary: things that need them (policies to read, requests to review), unread portal
 * notifications since the last summary, and today's celebrations. Everything is limited to what that person may see anyway.
 */
final class DigestBuilder
{
    private const MAX_NOTIFICATIONS = 8;

    private const MAX_POLICIES = 5;

    /**
     * @return array{policies: list<array<string, mixed>>, reviews: int, reviews_url: string, notifications: list<array<string, mixed>>, notifications_total: int, notifications_url: string, celebrations: list<array<string, mixed>>}
     */
    public static function for(User $user, ?CarbonImmutable $since = null): array
    {
        $base = rtrim((string) config('app.frontend_url'), '/');
        $since ??= CarbonImmutable::now()->subDay();

        // Policies still to read.
        $policies = Policy::query()->for($user)->orderBy('due_date')->get();
        $done = PolicyAcknowledgement::query()->where('user_id', $user->getKey())->whereIn('policy_id', $policies->pluck('id'))->get()->map(fn ($a) => $a->policy_id.':'.$a->version)->flip();
        $toRead = $policies->reject(fn (Policy $p) => isset($done[$p->id.':'.$p->version]))->take(self::MAX_POLICIES)->map(fn (Policy $p) => [
            'title' => $p->title, 'url' => "{$base}/policies/{$p->id}", 'due' => $p->due_date?->format('M j'), 'overdue' => $p->due_date?->isBefore(today()) ?? false,
        ])->values()->all();

        // Requests waiting for this person's review.
        $reviews = 0;
        if ($user->hasPermission('requests.team-review')) {
            $reviews = app(ApprovalRouting::class)->scopeFor(EmployeeRequest::query(), $user)->whereIn('status', [RequestStatus::Submitted->value, RequestStatus::UnderReview->value])->count();
        }

        // Unread portal notifications since the last summary.
        $unread = PortalNotification::query()->where('user_id', $user->getKey())->whereNull('read_at')->where('created_at', '>', $since);
        $total = (clone $unread)->count();
        $notifications = $unread->latest()->limit(self::MAX_NOTIFICATIONS)->get()->map(fn (PortalNotification $n) => [
            'title' => $n->title, 'message' => $n->message, 'url' => self::absolute($n->link), 'when' => $n->created_at->diffForHumans(),
        ])->all();

        // Today's celebrations, as everyone would see them on the dashboard.
        $today = Celebrations::upcoming(0, $user->getKey());
        $celebrations = [
            ...array_map(fn ($b) => ['kind' => 'birthday', 'name' => $b['is_you'] ? 'you' : $b['display_name']], array_filter($today['birthdays'], fn ($b) => $b['is_today'] && ! $b['is_you'])),
            ...array_map(fn ($a) => ['kind' => 'anniversary', 'name' => $a['display_name'], 'years' => $a['years']], array_filter($today['anniversaries'], fn ($a) => $a['is_today'] && ! $a['is_you'])),
        ];

        return [
            'policies' => $toRead, 'reviews' => $reviews, 'reviews_url' => "{$base}/admin/requests", 'notifications' => $notifications,
            'notifications_total' => $total, 'notifications_url' => "{$base}/notifications", 'celebrations' => array_slice($celebrations, 0, 6),
        ];
    }

    /** True when there is nothing to tell the person. */
    public static function isEmpty(array $digest): bool
    {
        return $digest['policies'] === [] && $digest['reviews'] === 0 && $digest['notifications_total'] === 0 && $digest['celebrations'] === [];
    }

    /** One sentence for the top of the email (and the inbox preview). */
    public static function summary(array $digest): string
    {
        $parts = [];
        if (($n = count($digest['policies'])) > 0) {
            $parts[] = $n.($n === 1 ? ' policy to read' : ' policies to read');
        }
        if ($digest['reviews'] > 0) {
            $parts[] = $digest['reviews'].($digest['reviews'] === 1 ? ' request to review' : ' requests to review');
        }
        if ($digest['notifications_total'] > 0) {
            $parts[] = $digest['notifications_total'].($digest['notifications_total'] === 1 ? ' new notification' : ' new notifications');
        }
        if ($digest['celebrations'] !== []) {
            $parts[] = 'something to celebrate today';
        }

        return $parts === [] ? 'Nothing new today.' : 'You have '.implode(', ', array_slice($parts, 0, -1)).(count($parts) > 1 ? ' and ' : '').end($parts).'.';
    }

    /** An in-portal route (/policies/3) as a full address; anything that is not a plain route gets no link. */
    private static function absolute(?string $link): ?string
    {
        return $link !== null && preg_match('#^/[A-Za-z0-9/_\-?=&.%]*$#', $link) === 1 ? rtrim((string) config('app.frontend_url'), '/').$link : null;
    }
}
