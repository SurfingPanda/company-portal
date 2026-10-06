@extends('mail.layout')

@section('title', 'Your verification code')
@section('preheader', 'Your code is '.$code.'. It expires in '.$minutes.' minutes.')

@section('content')
    <h1 class="h1" style="margin:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;font-weight:normal;color:#0b1437;">Your verification code</h1>
    <p style="margin:0 0 12px 0;">Welcome! You are signing in for the first time (employee ID <strong>{{ $employeeId }}</strong>). Enter this code on the sign-in page to choose your password:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="panel" style="margin:18px 0;background-color:#f7f6f1;border:1px solid #ebe8dd;">
        <tr>
            <td align="center" style="padding:22px 12px;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:40px;letter-spacing:10px;font-weight:bold;color:#0b1437;" class="h1">{{ $code }}</td>
        </tr>
    </table>

    <p class="muted" style="margin:0 0 14px 0;font-size:13px;line-height:20px;color:#6b7280;">
        The code works once and expires in {{ $minutes }} minutes. If you did not try to sign in, ignore this email: nothing changes. Never share this code with anyone.
    </p>
@endsection

@section('footer')
    You are receiving this because someone started the first sign-in for this account.
@endsection
