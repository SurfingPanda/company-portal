@extends('mail.layout')

@php
    /** @var array $digest */
    $count = count($digest['policies']) + ($digest['reviews'] > 0 ? 1 : 0) + $digest['notifications_total'] + count($digest['celebrations']);
    $heading = 'font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;color:#2f7d3a;margin:26px 0 8px 0;padding-bottom:6px;border-bottom:2px solid #0b1437;';
@endphp

@section('title', 'Your daily summary')
@section('preheader', $count > 0 ? $summary : 'Nothing new today.')

@section('content')
    <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">{{ $date }}</p>
    <h1 class="h1" style="margin:0 0 10px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;font-weight:normal;color:#0b1437;">Good morning, {{ $name }}</h1>
    <p style="margin:0 0 4px 0;">{{ $count > 0 ? $summary : 'Nothing new since your last summary. Enjoy a quiet day.' }}</p>
    @if ($preview)
        <p class="panel" style="margin:12px 0 0 0;padding:10px 14px;background-color:#fdf1d9;border:1px solid #f0d99a;font-size:13px;line-height:19px;color:#7a4b00;">This is a preview you asked for. Your real summary arrives every morning when there is something to tell you.</p>
    @endif

    @if (count($digest['policies']) > 0 || $digest['reviews'] > 0)
        <div style="{{ $heading }}">Needs your attention</div>
        @foreach ($digest['policies'] as $policy)
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
                <tr>
                    <td class="panel" style="padding:12px 14px;background-color:#f7f6f1;border:1px solid #ebe8dd;border-left:4px solid {{ $policy['overdue'] ? '#b42318' : '#d97706' }};font-size:14px;line-height:20px;">
                        <a class="link" href="{{ $policy['url'] }}" style="color:#0b1437;font-weight:bold;text-decoration:none;">{{ $policy['title'] }}</a><br>
                        <span class="muted" style="color:#6b7280;font-size:12px;">Policy to read{{ $policy['due'] ? ' · '.($policy['overdue'] ? 'was due ' : 'please read by ').$policy['due'] : '' }}</span>
                    </td>
                </tr>
            </table>
        @endforeach
        @if ($digest['reviews'] > 0)
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
                <tr>
                    <td class="panel" style="padding:12px 14px;background-color:#f7f6f1;border:1px solid #ebe8dd;border-left:4px solid #0b1437;font-size:14px;line-height:20px;">
                        <a class="link" href="{{ $digest['reviews_url'] }}" style="color:#0b1437;font-weight:bold;text-decoration:none;">{{ $digest['reviews'] }} {{ $digest['reviews'] === 1 ? 'request is' : 'requests are' }} waiting for your review</a><br>
                        <span class="muted" style="color:#6b7280;font-size:12px;">From people on your team</span>
                    </td>
                </tr>
            </table>
        @endif
    @endif

    @if (count($digest['notifications']) > 0)
        <div style="{{ $heading }}">New in your portal</div>
        @foreach ($digest['notifications'] as $n)
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 4px 0;">
                <tr>
                    <td style="padding:9px 0;border-bottom:1px solid #ece9de;font-size:14px;line-height:20px;">
                        @if ($n['url'])
                            <a class="link" href="{{ $n['url'] }}" style="color:#0b1437;font-weight:bold;text-decoration:none;">{{ $n['title'] }}</a>
                        @else
                            <strong style="color:#0b1437;">{{ $n['title'] }}</strong>
                        @endif
                        <span class="muted" style="color:#9ca3af;font-size:12px;"> · {{ $n['when'] }}</span><br>
                        <span class="muted" style="color:#4b5563;">{{ \Illuminate\Support\Str::limit($n['message'], 140) }}</span>
                    </td>
                </tr>
            </table>
        @endforeach
        @if ($digest['notifications_total'] > count($digest['notifications']))
            <p style="margin:8px 0 0 0;font-size:13px;"><a class="link" href="{{ $digest['notifications_url'] }}" style="color:#0b1437;">and {{ $digest['notifications_total'] - count($digest['notifications']) }} more in the portal</a></p>
        @endif
    @endif

    @if (count($digest['celebrations']) > 0)
        <div style="{{ $heading }}">Today</div>
        @foreach ($digest['celebrations'] as $c)
            <p style="margin:0 0 6px 0;font-size:14px;line-height:20px;">{{ $c['kind'] === 'birthday' ? "It's {$c['name']}'s birthday" : "{$c['name']} celebrates {$c['years']} ".($c['years'] === 1 ? 'year' : 'years').' with the company' }}</p>
        @endforeach
    @endif

    @include('mail.partials.button', ['url' => $portalUrl, 'label' => 'Open the portal'])
@endsection

@section('footer')
    This is your daily summary, sent in the morning when there is something to tell you.
    <a class="link" href="{{ $settingsUrl }}" style="color:#0b1437;">Choose how you get email</a> (instantly, once a day, or not at all).
@endsection
