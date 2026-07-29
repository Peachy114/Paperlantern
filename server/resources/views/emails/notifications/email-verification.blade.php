@extends('emails.notifications.layout')

@section('content')
    <p style="margin:0 0 16px 0; color:#334155; font-size:15px; line-height:1.7;">
        Hi {{ $recipientName ?? 'there' }},
    </p>

    <p style="margin:0 0 18px 0; color:#334155; font-size:15px; line-height:1.7;">
        Use this code to verify your LaternComix account.
    </p>

    <div style="margin:22px 0; padding:18px 20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; text-align:center;">
        <div style="font-size:30px; letter-spacing:8px; font-weight:900; color:#0f172a;">
            {{ $verificationCode }}
        </div>
        <div style="margin-top:8px; color:#64748b; font-size:13px;">
            This code expires in 15 minutes.
        </div>
    </div>

    <p style="margin:0 0 14px 0; color:#334155; font-size:15px; line-height:1.7;">
        If you did not create this account, you can safely ignore this email.
    </p>
@endsection
