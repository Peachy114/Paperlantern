@extends('emails.notifications.layout')

@section('content')
    @if(! empty($recipientName))
        <p style="margin:0 0 16px 0; color:#334155; font-size:15px; line-height:1.7;">
            Hi {{ $recipientName }},
        </p>
    @endif

    @forelse($lines ?? [] as $line)
        <p style="margin:0 0 14px 0; color:#334155; font-size:15px; line-height:1.7;">
            {{ $line }}
        </p>
    @empty
        <p style="margin:0 0 14px 0; color:#334155; font-size:15px; line-height:1.7;">
            You have a new notification from LaternComix.
        </p>
    @endforelse

    @if(! empty($actionUrl))
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
                <td style="background:#0ea5e9; border-radius:999px;">
                    <a href="{{ $actionUrl }}" style="display:inline-block; padding:13px 24px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:800;">
                        {{ $actionLabel ?? 'Open LaternComix' }}
                    </a>
                </td>
            </tr>
        </table>
    @endif
@endsection
