ELJIN CORPORATION - Employee Portal
{{ $date }}

Good morning, {{ $name }}.
{{ ($digest['policies'] || $digest['reviews'] > 0 || $digest['notifications'] || $digest['celebrations']) ? $summary : 'Nothing new since your last summary.' }}
@if ($digest['policies'] || $digest['reviews'] > 0)

NEEDS YOUR ATTENTION
@foreach ($digest['policies'] as $policy)
- Policy to read: {{ $policy['title'] }}{{ $policy['due'] ? ' ('.($policy['overdue'] ? 'was due ' : 'by ').$policy['due'].')' : '' }} {{ $policy['url'] }}
@endforeach
@if ($digest['reviews'] > 0)
- {{ $digest['reviews'] }} request(s) waiting for your review: {{ $digest['reviews_url'] }}
@endif
@endif
@if ($digest['notifications'])

NEW IN YOUR PORTAL
@foreach ($digest['notifications'] as $n)
- {{ $n['title'] }} ({{ $n['when'] }}): {{ \Illuminate\Support\Str::limit($n['message'], 140) }}
@endforeach
@if ($digest['notifications_total'] > count($digest['notifications']))
...and {{ $digest['notifications_total'] - count($digest['notifications']) }} more: {{ $digest['notifications_url'] }}
@endif
@endif
@if ($digest['celebrations'])

TODAY
@foreach ($digest['celebrations'] as $c)
- {{ $c['kind'] === 'birthday' ? "It's {$c['name']}'s birthday" : "{$c['name']} celebrates {$c['years']} year(s) with the company" }}
@endforeach
@endif

Open the portal: {{ $portalUrl }}
Choose how you get email: {{ $settingsUrl }}
