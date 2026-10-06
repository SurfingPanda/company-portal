@extends('mail.layout')

@section('title', $purpose === 'activation' ? 'Activate your account' : 'Reset your password')
@section('preheader', $purpose === 'activation' ? 'Choose your password to start using the Employee Portal.' : 'Choose a new password for the Employee Portal.')

@section('content')
    <h1 class="h1" style="margin:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;font-weight:normal;color:#0b1437;">
        {{ $purpose === 'activation' ? 'Welcome to the Employee Portal' : 'Reset your password' }}
    </h1>
    @if ($purpose === 'activation')
        <p style="margin:0 0 12px 0;">An Employee Portal account was created for you. Your employee ID is <strong>{{ $employeeId }}</strong>.</p>
        <p style="margin:0 0 4px 0;">Choose your password to activate it. You can also just sign in at the portal with your employee ID or company email and follow the prompts.</p>
    @else
        <p style="margin:0 0 12px 0;">We received a request to reset the password for employee ID <strong>{{ $employeeId }}</strong>.</p>
        <p style="margin:0 0 4px 0;">Choose a new password to get back in.</p>
    @endif

    @include('mail.partials.button', ['url' => $url, 'label' => 'Choose my password'])

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="panel" style="margin:22px 0 14px 0;background-color:#f7f6f1;border:1px solid #ebe8dd;">
        <tr>
            <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#4b5563;">
                The link works once and expires in {{ $hours }} hours. If you did not expect this email, ignore it: your password does not change.
            </td>
        </tr>
    </table>
@endsection
