@extends('mail.layout')

@section('title', 'Your password was changed')
@section('preheader', 'The password for employee ID '.$employeeId.' was just changed.')

@section('content')
    <span style="display:inline-block;padding:3px 10px;margin:0 0 14px 0;background-color:#fdeceb;color:#8a1c14;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Security notice</span>
    <h1 class="h1" style="margin:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;font-weight:normal;color:#0b1437;">Your password was changed</h1>
    <p style="margin:0 0 12px 0;">The password for employee ID <strong>{{ $employeeId }}</strong> was changed on {{ $when }}, and you were signed out of your other devices.</p>
    <p style="margin:0 0 4px 0;">If this was you, there is nothing more to do.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="panel" style="margin:22px 0 14px 0;background-color:#fdf1d9;border:1px solid #f0d99a;">
        <tr>
            <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#7a4b00;">
                <strong>Was this not you?</strong> Someone else may have your account. Open the sign-in page, choose <em>Forgot your password?</em> to set a new one, and tell IT.
            </td>
        </tr>
    </table>

    @include('mail.partials.button', ['url' => $resetUrl, 'label' => 'Go to the sign-in page'])
@endsection

@section('footer')
    This security notice is sent every time a password changes, whatever your email settings.
@endsection
