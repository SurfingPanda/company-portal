<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>@yield('title', config('app.name'))</title>
    <style>
        body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; }
        a { color: #0b1437; }
        @media only screen and (max-width: 620px) {
            .container { width: 100% !important; }
            .px { padding-left: 22px !important; padding-right: 22px !important; }
            .h1 { font-size: 22px !important; }
        }
        @media (prefers-color-scheme: dark) {
            .page { background-color: #0a0e1f !important; }
            .card { background-color: #121832 !important; border-color: #232b52 !important; }
            .text { color: #e6e9f5 !important; }
            .muted { color: #9aa3c7 !important; }
            .h1 { color: #ffffff !important; }
            .panel { background-color: #1a2142 !important; border-color: #2b3566 !important; }
            .footer { background-color: #0e1329 !important; }
            .link { color: #9db4ff !important; }
            .btn { background-color: #46c35c !important; }
            .btn a { color: #08122b !important; }
        }
    </style>
</head>
<body class="page" style="margin:0;padding:0;background-color:#f1efe8;">
    {{-- Preview text shown next to the subject in the inbox. --}}
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
        @yield('preheader')&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="page" style="background-color:#f1efe8;">
        <tr>
            <td align="center" style="padding:28px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container card" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid #e4e1d6;">
                    {{-- Brand header --}}
                    <tr>
                        <td style="background-color:#2f9e44;height:4px;line-height:4px;font-size:0;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td class="px" style="background-color:#0b1437;padding:26px 36px 24px 36px;">
                            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8fa3e6;font-weight:bold;">ELJIN CORPORATION</div>
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:30px;color:#ffffff;margin-top:4px;">Employee Portal</div>
                        </td>
                    </tr>

                    {{-- Content --}}
                    <tr>
                        <td class="px text" style="padding:34px 36px 26px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#1f2937;">
                            @yield('content')
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td class="px footer" style="background-color:#f7f6f1;padding:22px 36px;border-top:1px solid #ebe8dd;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b7280;">
                            @hasSection('footer')
                                @yield('footer')
                            @else
                                You are receiving this because you have an account on the ELJIN Employee Portal.
                            @endif
                            <br><br>
                            <span class="muted" style="color:#9ca3af;">&copy; {{ now()->year }} ELJIN CORPORATION. For authorized employees only.</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
