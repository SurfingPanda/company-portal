@extends('mail.layout')

@php
    $tone = match ($type) {
        'announcement' => ['Announcement', '#0b1437', '#e8ecfb'],
        'request' => ['Request update', '#7a4b00', '#fdf1d9'],
        'event' => ['Event', '#0f5d2a', '#e1f4e6'],
        'document' => ['Document', '#3b2a7a', '#ece8fb'],
        'hr' => ['HR', '#0f5d2a', '#e1f4e6'],
        'it' => ['IT', '#0b4a6f', '#e0f1fb'],
        default => ['Notice', '#374151', '#eceef1'],
    };
@endphp

@section('title', $title)
@section('preheader', \Illuminate\Support\Str::limit($body, 110))

@section('content')
    <span style="display:inline-block;padding:3px 10px;margin:0 0 14px 0;background-color:{{ $tone[2] }};color:{{ $tone[1] }};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">{{ $tone[0] }}</span>
    <h1 class="h1" style="margin:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;font-weight:normal;color:#0b1437;">{{ $title }}</h1>
    <p style="margin:0 0 6px 0;">{{ $body }}</p>

    @if ($url)
        @include('mail.partials.button', ['url' => $url, 'label' => 'Open in the portal'])
    @endif
@endsection

@section('footer')
    You get an email for each portal notification because that is how you chose to be notified.
    <a class="link" href="{{ $settingsUrl }}" style="color:#0b1437;">Change your email settings</a>
@endsection
