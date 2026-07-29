<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <meta name="x-apple-disable-message-reformatting">

    <title>
        {{ $subject ?? ($title ?? 'LaterNComix') }}
    </title>

    <style>
        @media only screen and (max-width: 640px) {
            .email-page {
                padding: 14px 8px !important;
            }

            .email-shell {
                border-radius: 18px !important;
            }

            .email-padding {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }

            .header-wordmark {
                font-size: 15px !important;
            }

            .header-navigation {
                display: none !important;
            }

            .title-heading {
                font-size: 27px !important;
            }

            .homepage-copy,
            .homepage-action {
                display: block !important;
                width: 100% !important;
                text-align: left !important;
            }

            .homepage-action {
                padding-top: 18px !important;
            }

            .footer-character {
                display: none !important;
            }

            .footer-center {
                width: 100% !important;
            }

            .footer-link {
                display: inline-block !important;
                margin: 5px 7px !important;
            }
        }
    </style>
</head>

<body
    style="
        margin: 0;
        padding: 0;
        background-color: #eef3f8;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
    ">
    {{-- Hidden inbox preview text --}}
    <div
        style="
            display: none;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            color: transparent;
        ">
        {{ $preheader ?? ($title ?? 'LaterNComix notification') }}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color: #eef3f8;">
        <tr>
            <td align="center" class="email-page" style="padding: 32px 14px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    class="email-shell"
                    style="
                        width: 100%;
                        max-width: 620px;
                        overflow: hidden;
                        background-color: #ffffff;
                        border: 2px solid #dbe7f1;
                        border-radius: 24px;
                        box-shadow: 0 18px 46px rgba(31, 67, 97, 0.12);
                    ">
                    {{-- ================================================== --}}
                    {{-- TOP COLOUR STRIP --}}
                    {{-- ================================================== --}}

                    <tr>
                        <td
                            style="
                                height: 7px;
                                background-color: #45adf5;
                                background-image: linear-gradient(
                                    90deg,
                                    #45adf5 0%,
                                    #45adf5 45%,
                                    #ff6b8a 45%,
                                    #ff6b8a 70%,
                                    #ffad53 70%,
                                    #ffad53 100%
                                );
                                font-size: 0;
                                line-height: 0;
                            ">
                            &nbsp;
                        </td>
                    </tr>

                    {{-- ================================================== --}}
                    {{-- HEADER --}}
                    {{-- ================================================== --}}

                    <tr>
                        <td class="email-padding"
                            style="
                                padding: 18px 28px;
                                background-color: #ffffff;
                                border-bottom: 1px solid #edf2f7;
                            ">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    {{-- Logo and wordmark --}}
                                    <td valign="middle">
                                        <a href="{{ url('/') }}" target="_blank" rel="noopener noreferrer"
                                            style="text-decoration: none;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td width="48" valign="middle">
                                                        <img src="{{ rtrim(config('app.frontend_url'), '/') }}/LOGO.png"
                                                            width="46"
                                                            style="
                                                                display: block;
                                                                width: 46px;
                                                                max-width: 46px;
                                                                height: auto;
                                                                border: 0;
                                                                border-radius: 12px;
                                                            ">
                                                    </td>

                                                    <td valign="middle" style="padding-left: 10px;">
                                                        <div class="header-wordmark"
                                                            style="
                                                                color: #111827;
                                                                font-size: 17px;
                                                                line-height: 1.15;
                                                                font-weight: 900;
                                                            ">
                                                            LaterNComix
                                                        </div>

                                                        <div
                                                            style="
                                                                margin-top: 3px;
                                                                color: #45adf5;
                                                                font-size: 8px;
                                                                line-height: 1.4;
                                                                font-weight: 800;
                                                                letter-spacing: 0.15em;
                                                            ">
                                                            STORIES • ART • CREATORS
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </a>
                                    </td>

                                    {{-- Compact website navigation --}}
                                    <td align="right" valign="middle" class="header-navigation">
                                        <a href="{{ url('/comix') }}" target="_blank" rel="noopener noreferrer"
                                            style="
                                                margin-left: 13px;
                                                color: #45adf5;
                                                font-size: 9px;
                                                font-weight: 900;
                                                text-decoration: none;
                                            ">
                                            COMIX
                                        </a>

                                        <a href="{{ url('/explore/arts') }}" target="_blank" rel="noopener noreferrer"
                                            style="
                                                margin-left: 13px;
                                                color: #45adf5;
                                                font-size: 9px;
                                                font-weight: 900;
                                                text-decoration: none;
                                            ">
                                            ARTS
                                        </a>

                                        <a href="{{ url('/commissions') }}" target="_blank" rel="noopener noreferrer"
                                            style="
                                                margin-left: 13px;
                                                color: #45adf5;
                                                font-size: 9px;
                                                font-weight: 900;
                                                text-decoration: none;
                                            ">
                                            COMMISSIONS
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- ================================================== --}}
                    {{-- TITLE BANNER --}}
                    {{-- ================================================== --}}

                    <tr>
                        <td class="email-padding"
                            style="
                                padding: 24px 28px 0 28px;
                                background-color: #ffffff;
                            ">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="
                                    background-color: #45adf5;
                                    border: 2px solid #208fda;
                                    border-radius: 20px;
                                    overflow: hidden;
                                ">
                                <tr>
                                    <td
                                        style="
                                            padding: 28px 28px 26px 28px;
                                            background-color: #45adf5;
                                        ">
                                        <div
                                            style="
                                                display: inline-block;
                                                padding: 6px 10px;
                                                background-color: #ffad53;
                                                border: 2px solid #ffffff;
                                                border-radius: 999px;
                                                color: #111827;
                                                font-size: 9px;
                                                line-height: 1;
                                                font-weight: 900;
                                                letter-spacing: 0.08em;
                                                text-transform: uppercase;
                                            ">
                                            {{ $eyebrow ?? 'LaterNComix Update' }}
                                        </div>

                                        <h1 class="title-heading"
                                            style="
                                                margin: 13px 0 0 0;
                                                color: #ffffff;
                                                font-size: 31px;
                                                line-height: 1.15;
                                                font-weight: 900;
                                            ">
                                            {{ $title ?? ($subject ?? 'Notification') }}
                                        </h1>

                                        {{-- @isset($subtitle)
                                            <p
                                                style="
                                                    margin: 10px 0 0 0;
                                                    max-width: 480px;
                                                    color: #ebf8ff;
                                                    font-size: 13px;
                                                    line-height: 1.65;
                                                ">
                                                {{ $subtitle }}
                                            </p>
                                        @endisset --}}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- ================================================== --}}
                    {{-- CHILD EMAIL CONTENT --}}
                    {{-- ================================================== --}}

                    <tr>
                        <td class="email-padding"
                            style="
                                padding: 22px 28px 28px 28px;
                                background-color: #ffffff;
                            ">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="
                                    background-color: #ffffff;
                                    border: 2px solid #e2ebf3;
                                    border-radius: 18px;
                                ">
                                <tr>
                                    <td style="padding: 26px;">
                                        @yield('content')
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- ================================================== --}}
                    {{-- HOMEPAGE CTA --}}
                    {{-- ================================================== --}}

                    <tr>
                        <td class="email-padding"
                            style="
                                padding: 0 28px 28px 28px;
                                background-color: #ffffff;
                            ">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="
                                    background-color: #fff5e7;
                                    border: 2px solid #ffcf92;
                                    border-radius: 18px;
                                ">
                                <tr>
                                    <td style="padding: 22px 24px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                            border="0">
                                            <tr>
                                                <td width="66%" valign="middle" class="homepage-copy">
                                                    <div
                                                        style="
                                                            color: #111827;
                                                            font-size: 17px;
                                                            line-height: 1.3;
                                                            font-weight: 900;
                                                        ">
                                                        Explore LaternComix
                                                    </div>

                                                    <div
                                                        style="
                                                            margin-top: 6px;
                                                            color: #64748b;
                                                            font-size: 12px;
                                                            line-height: 1.65;
                                                        ">
                                                        Discover serialized comics,
                                                        graphic narratives, original artwork,
                                                        and stories from independent creators.
                                                    </div>
                                                </td>

                                                <td width="34%" align="right" valign="middle"
                                                    class="homepage-action">
                                                    <a href="{{ url('/') }}" target="_blank"
                                                        rel="noopener noreferrer"
                                                        style="
                                                            display: inline-block;
                                                            padding: 12px 18px;
                                                            background-color: #45adf5;
                                                            border: 2px solid #208fda;
                                                            border-radius: 999px;
                                                            color: #ffffff;
                                                            font-size: 11px;
                                                            line-height: 1;
                                                            font-weight: 900;
                                                            text-decoration: none;
                                                        ">
                                                        Explore now
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- ================================================== --}}
                    {{-- FOOTER --}}
                    {{-- ================================================== --}}
                    <tr>
                        <td class="email-padding"
                            style="
                                padding: 24px 24px 18px 24px;
                                background-color: #45adf5;
                                border-top: 2px solid #208fda;
                            ">

                            {{-- Footer centre --}}
                        <td align="center" valign="top" class="footer-center">
                            <p
                                style="
                                                margin: 0 auto;
                                                max-width: 390px;
                                                color: #eff9ff;
                                                font-size: 10px;
                                                line-height: 1.65;
                                            ">
                                Discover new releases, original artwork,
                                creator commissions, and community updates
                                from LaternComix.
                            </p>

                            {{-- Main links --}}
                            <div style="margin-top: 16px;">
                                <a href="{{ url('/comix') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #ffffff;
                                                    font-size: 9px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    COMIX
                                </a>

                                <a href="{{ url('/explore/arts') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #ffffff;
                                                    font-size: 9px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    ARTS
                                </a>

                                <a href="{{ url('/commissions') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #ffffff;
                                                    font-size: 9px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    COMMISSIONS
                                </a>

                                <a href="{{ url('/become-creator') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #ffffff;
                                                    font-size: 9px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    BECOME CREATOR
                                </a>

                                <a href="{{ url('/studio') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #ffffff;
                                                    font-size: 9px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    STUDIO
                                </a>

                                <a href="{{ url('/about') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #ffffff;
                                                    font-size: 9px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    ABOUT
                                </a>

                                <a href="{{ url('/blog') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #ffffff;
                                                    font-size: 9px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    BLOG
                                </a>
                            </div>

                            {{-- Legal links --}}
                            <div style="margin-top: 13px;">
                                <a href="{{ url('/privacy-policy') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #daf2ff;
                                                    font-size: 8px;
                                                    font-weight: 700;
                                                    text-decoration: none;
                                                ">
                                    PRIVACY POLICY
                                </a>

                                <a href="{{ url('/terms-and-services') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #daf2ff;
                                                    font-size: 8px;
                                                    font-weight: 700;
                                                    text-decoration: none;
                                                ">
                                    TERMS AND SERVICE
                                </a>

                                <a href="{{ url('/cookies') }}" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    margin: 0 6px;
                                                    color: #daf2ff;
                                                    font-size: 8px;
                                                    font-weight: 700;
                                                    text-decoration: none;
                                                ">
                                    COOKIES
                                </a>
                            </div>

                            {{-- Social links --}}
                            <div style="margin-top: 15px;">
                                <a href="https://discord.com" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    display: inline-block;
                                                    margin: 0 4px;
                                                    padding: 7px 10px;
                                                    background-color: #ffffff;
                                                    border-radius: 999px;
                                                    color: #45adf5;
                                                    font-size: 8px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    Discord
                                </a>

                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    display: inline-block;
                                                    margin: 0 4px;
                                                    padding: 7px 10px;
                                                    background-color: #ffffff;
                                                    border-radius: 999px;
                                                    color: #45adf5;
                                                    font-size: 8px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    Instagram
                                </a>

                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                    class="footer-link"
                                    style="
                                                    display: inline-block;
                                                    margin: 0 4px;
                                                    padding: 7px 10px;
                                                    background-color: #ffffff;
                                                    border-radius: 999px;
                                                    color: #45adf5;
                                                    font-size: 8px;
                                                    font-weight: 900;
                                                    text-decoration: none;
                                                ">
                                    Facebook
                                </a>
                            </div>
                        </td>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                {{-- Left mascot --}}
                                <td width="90" valign="bottom" align="left" class="footer-character">
                                    <img src="{{ rtrim(config('app.frontend_url'), '/') }}/LOGO.png"
                                        style="
                                                display: block;
                                                width: 74px;
                                                max-width: 74px;
                                                height: auto;
                                                border: 0;
                                            ">
                                </td>

                                {{-- Right mascot --}}
                                <td width="90" valign="bottom" align="right" class="footer-character">
                                    <img src="{{ asset('riri_body_1.png') }}" alt="" width="78"
                                        style="
                                                display: block;
                                                width: 78px;
                                                max-width: 78px;
                                                height: auto;
                                                border: 0;
                                            ">
                                </td>
                            </tr>
                        </table>
            </td>
        </tr>

        {{-- ================================================== --}}
        {{-- COPYRIGHT BAR --}}
        {{-- ================================================== --}}

        <tr>
            <td align="center" class="email-padding"
                style="
                                padding: 14px 24px;
                                background-color: #2f9de9;
                                border-top: 1px solid rgba(255, 255, 255, 0.20);
                            ">
                <p
                    style="
                                    margin: 0;
                                    color: #dff4ff;
                                    font-size: 9px;
                                    line-height: 1.6;
                                ">
                    You are receiving this because notifications are
                    enabled on your LaternComix account.
                </p>

                <p
                    style="
                                    margin: 5px 0 0 0;
                                    color: #dff4ff;
                                    font-size: 9px;
                                    line-height: 1.5;
                                ">
                    &copy; {{ date('Y') }} LaternComix.
                    All rights reserved.
                </p>
            </td>
        </tr>
    </table>
    </td>
    </tr>
    </table>
</body>

</html>
