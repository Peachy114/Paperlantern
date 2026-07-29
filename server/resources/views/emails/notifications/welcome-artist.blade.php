@extends('emails.notifications.layout')

@section('content')
    <p style="margin:0 0 16px 0; color:#334155; font-size:15px; line-height:1.7;">
        Hi {{ $recipientName ?? 'creator' }},
    </p>

    <p style="margin:0 0 14px 0; color:#334155; font-size:15px; line-height:1.7;">
        Welcome to LaternComix Studio. Your artist account is ready, and you can start building your series, chapters, arts, shop products, commissions, and creator profile.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px;">
        <tr>
            <td style="padding:18px;">
                <p style="margin:0 0 10px 0; color:#0f172a; font-size:14px; font-weight:900;">You can start with:</p>
                <p style="margin:0; color:#475569; font-size:14px; line-height:1.8;">
                    Create your first work<br>
                    Upload arts and organize your profile<br>
                    Open commission services when approved<br>
                    Review comments, earnings, and notifications
                </p>
            </td>
        </tr>
    </table>

    @if(! empty($actionUrl))
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
                <td style="background:#0ea5e9; border-radius:999px;">
                    <a href="{{ $actionUrl }}" style="display:inline-block; padding:13px 24px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:800;">
                        {{ $actionLabel ?? 'Open Studio' }}
                    </a>
                </td>
            </tr>
        </table>
    @endif
@endsection
