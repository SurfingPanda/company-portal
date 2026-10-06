{{-- A button that works in every email client (a table cell, not a styled link). Needs $url and $label. --}}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 8px 0;">
    <tr>
        <td class="btn" align="center" bgcolor="#0b1437" style="background-color:#0b1437;border-radius:3px;">
            <a href="{{ $url }}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;line-height:20px;color:#ffffff;text-decoration:none;">{{ $label }}</a>
        </td>
    </tr>
</table>
<p class="muted" style="margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b7280;">
    Button not working? Copy this address into your browser:<br>
    <a class="link" href="{{ $url }}" style="color:#0b1437;word-break:break-all;">{{ $url }}</a>
</p>
