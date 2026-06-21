// pages/CookiesPolicy.tsx
import { useNavigate } from 'react-router-dom'

const SECTIONS = [
    {
        number: '01',
        title: 'What Are Cookies',
        accentColor: '#f59e0b',
        sticky: { text: 'just the basics 🍪', color: '#fef08a', rotate: '-2deg' },
        quote: '"small files, big difference 🍪"',
        items: [
            {
                title: 'Definition',
                text: 'Cookies are small text files stored on your device when you visit a website. They help the site remember you and your preferences.',
                warn: false,
            },
            {
                title: 'They Are Safe',
                text: 'Cookies cannot run code or carry viruses. They only store small pieces of information relevant to your experience on Later N Comix.',
                warn: false,
            },
        ],
    },
    {
        number: '02',
        title: 'Cookies We Use',
        accentColor: '#34d399',
        sticky: { text: 'keeping you logged in 🔑', color: '#86efac', rotate: '1.5deg' },
        quote: null,
        items: [
            {
                title: 'Session Cookies',
                text: 'Keep you logged in while you browse. Without these, you would have to log in every single page visit.',
                warn: false,
            },
            {
                title: 'Preference Cookies',
                text: 'Save your dark mode setting so the site looks right every time you come back.',
                warn: false,
            },
            {
                title: 'Reading Progress',
                text: 'Remember where you left off in a chapter so you can pick up right where you stopped.',
                warn: false,
            },
            {
                title: 'Security Cookies',
                text: 'Help us detect unusual login activity and protect your account from unauthorized access.',
                warn: false,
            },
        ],
    },
    {
        number: '03',
        title: "What We Don't Do",
        accentColor: '#fb923c',
        sticky: { text: 'no ad tracking 🚫', color: '#fca5a5', rotate: '-1.5deg' },
        quote: '"no tracking, no selling, no nonsense 🚫"',
        items: [
            {
                title: 'No Ad Tracking',
                text: 'We do not use third-party advertising cookies. Your browsing habits are not tracked for ad targeting.',
                warn: false,
            },
            {
                title: "We Don't Sell Data",
                text: 'Your data is never sold to advertisers or third parties. What happens on Later N Comix stays on Later N Comix.',
                warn: false,
            },
            {
                title: 'No Cross-Site Tracking',
                text: 'We do not track you across other websites. Our cookies only work on laterncomix.app.',
                warn: false,
            },
        ],
    },
    {
        number: '04',
        title: 'Managing Cookies',
        accentColor: '#a78bfa',
        sticky: { text: 'got it? 👍', color: '#c4b5fd', rotate: '2deg' },
        quote: null,
        items: [
            {
                title: 'Browser Settings',
                text: "You can control or delete cookies through your browser settings at any time. Check your browser's help docs for instructions.",
                warn: false,
            },
            {
                title: 'Disabling Cookies',
                text: 'Disabling cookies may affect your experience. Features like staying logged in or dark mode may stop working correctly.',
                warn: true,
            },
            {
                title: 'Questions',
                text: 'If you have any questions about how we use cookies, reach us at privacy@laterncomix.app',
                warn: false,
            },
        ],
    },
]

export default function CookiesPolicy() {
    const navigate = useNavigate()

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
                rel="stylesheet"
            />

            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
                <div className="flex gap-0 mb-4">
                    {/* ── Spine ── */}
                    <div
                        className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808] border-l border-border"
                        style={{ minHeight: '400px' }}
                    >
                        <span
                            className="text-amber-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            LATER N COMIX
                        </span>
                        <span
                            className="text-white/20 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            STUDIO
                        </span>
                    </div>

                    {/* ── Main panel ── */}
                    <div
                        className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-visible bg-[#fffdf5] dark:bg-[#1c1a17]"
                        style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
                    >
                        {/* Header */}
                        <div className="relative border-b-[2.5px] border-[#1a1a1a] px-3 sm:px-5 py-3 sm:py-5 bg-[#fffdf5] dark:bg-[#1c1717] overflow-visible">
                            <p
                                className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px] tracking-[0.1em] mb-1"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                ◆ OFFICIAL_DOC · EST.2025 · COOKIE POLICY
                            </p>
                            <h1
                                className="text-[#1a1a1a] dark:text-foreground leading-none"
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: 'clamp(26px, 6vw, 42px)',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                COOKIE POLICY
                            </h1>
                            <p
                                className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[12px] sm:text-small"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                we only use cookies that make paper lantern work properly for you
                            </p>
                            <div
                                className="mt-3 h-[2px] opacity-40"
                                style={{
                                    background:
                                        'linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b,#d97706)',
                                }}
                            />
                        </div>

                        {/* TOC bar */}
                        <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:px-5 py-3 flex items-center justify-between">
                            <span
                                className="text-white text-[12px] sm:text-normal tracking-[0.18em]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                ◆ TABLE OF CONTENTS
                            </span>
                            <div
                                className="px-2 py-1 -rotate-[1.5deg] text-[10px] sm:text-xsmall shrink-0"
                                style={{
                                    background: '#86efac',
                                    fontFamily: "'Kalam', cursive",
                                    color: '#1a1a1a',
                                    boxShadow: '1px 2px 4px rgba(0,0,0,0.25)',
                                }}
                            >
                                4 sections
                            </div>
                        </div>

                        {/* Sections */}
                        <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                            <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/50 dark:bg-red-500/20 pointer-events-none z-10" />

                            {SECTIONS.map((section, si) => (
                                <div
                                    key={section.number}
                                    className={`relative overflow-visible pt-1 ${si % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'}`}
                                >
                                    {/* Sticky note */}
                                    <div
                                        className="absolute -top-3 right-3 px-2 sm:px-2.5 pt-3 py-1 text-[9px] sm:text-[10px] leading-tight z-20 whitespace-nowrap pointer-events-none"
                                        style={{
                                            background: section.sticky.color,
                                            fontFamily: "'Kalam', cursive",
                                            color: '#1a1a1a',
                                            boxShadow: '2px 3px 0 rgba(0,0,0,0.2)',
                                            transform: `rotate(${section.sticky.rotate})`,
                                        }}
                                    >
                                        <div
                                            className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-3.5 opacity-50"
                                            style={{
                                                background: 'rgba(251,191,36,0.45)',
                                                border: '1px solid rgba(0,0,0,0.07)',
                                            }}
                                        />
                                        {section.sticky.text}
                                    </div>

                                    {/* Section header */}
                                    <div
                                        className="flex items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-5 py-2.5 border-b border-black/[0.08] dark:border-white/[0.08]"
                                        style={{ borderLeft: `3px solid ${section.accentColor}` }}
                                    >
                                        <span
                                            className="text-[#1a1a1a]/35 dark:text-foreground/35 text-[11px] tracking-[0.15em]"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            [{section.number}]
                                        </span>
                                        <h2
                                            className="text-[#1a1a1a] dark:text-foreground text-[18px] sm:text-[20px]"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.08em',
                                            }}
                                        >
                                            {section.title}
                                        </h2>
                                        <div
                                            className="flex-1 h-[1px] ml-1 opacity-20 dark:opacity-10"
                                            style={{
                                                background: `linear-gradient(90deg, ${section.accentColor}, transparent)`,
                                            }}
                                        />
                                    </div>

                                    {/* Quote sticky */}
                                    {section.quote && (
                                        <div className="px-3 sm:pl-14 sm:pr-5 pt-3">
                                            <div
                                                className="inline-block px-3 py-2 text-[12px] sm:text-[13px]"
                                                style={{
                                                    background: '#fef08a',
                                                    fontFamily: "'Kalam', cursive",
                                                    color: '#1a1a1a',
                                                    transform: 'rotate(-0.5deg)',
                                                    boxShadow: '2px 2px 0 rgba(0,0,0,0.12)',
                                                }}
                                            >
                                                {section.quote}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div className="px-3 sm:pl-14 sm:pr-5 py-2.5 flex flex-col gap-1.5">
                                        {section.items.map((item, ii) => (
                                            <div
                                                key={ii}
                                                className="flex gap-2.5 sm:gap-3 items-start px-2 sm:px-3 py-1.5"
                                            >
                                                <span
                                                    className="shrink-0 mt-0.5 text-[11px]"
                                                    style={{
                                                        fontFamily: "'Kalam', cursive",
                                                        color: item.warn
                                                            ? '#92400e'
                                                            : 'rgba(26,26,26,0.35)',
                                                    }}
                                                >
                                                    {item.warn ? '!!' : '//'}
                                                </span>
                                                <p
                                                    className="text-[12.5px] sm:text-[13px] leading-relaxed"
                                                    style={{ fontFamily: "'Noto Serif', serif" }}
                                                >
                                                    <span
                                                        className="mr-1"
                                                        style={{
                                                            fontFamily: "'Bebas Neue', sans-serif",
                                                            fontSize: '13px',
                                                            letterSpacing: '0.1em',
                                                            color: item.warn
                                                                ? '#92400e'
                                                                : undefined,
                                                        }}
                                                    >
                                                        {item.title} —
                                                    </span>
                                                    {item.warn ? (
                                                        <span style={{ color: '#92400e' }}>
                                                            {item.text}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[#1a1a1a]/75 dark:text-foreground/70">
                                                            {item.text}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Big sticky note closing ── */}
                        <div className="px-3 sm:px-5 py-6 flex justify-center bg-[#faf8ee] dark:bg-[#191713] border-t border-black/[0.06] dark:border-white/[0.06]">
                            <div
                                className="relative w-full max-w-sm px-5 pt-8 pb-6"
                                style={{
                                    background: '#fef08a',
                                    boxShadow: '3px 4px 0 rgba(0,0,0,0.18)',
                                    transform: 'rotate(-1.2deg)',
                                    fontFamily: "'Kalam', cursive",
                                }}
                            >
                                <div
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 opacity-60"
                                    style={{
                                        background: 'rgba(251,191,36,0.45)',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                    }}
                                />
                                <p
                                    className="text-[#1a1a1a] text-[15px] sm:text-[17px] mb-2 leading-none"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    JUST THE ESSENTIALS
                                </p>
                                <p className="text-[#1a1a1a]/80 text-[12.5px] sm:text-[13.5px] leading-relaxed">
                                    No ads, no tracking, no nonsense. We only use cookies that make
                                    Later N Comix work properly for you. Your data stays yours. 🍪
                                </p>
                                <p
                                    className="mt-3 text-[#1a1a1a]/40 text-[11px]"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    — The Later N Comix Team 🏮
                                </p>
                            </div>
                        </div>

                        {/* Footer bar */}
                        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
                            <span
                                className="text-[#1a1a1a]/25 dark:text-foreground/25 text-[10px] sm:text-xsmall tracking-[0.15em]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                COOKIE POLICY · V1.0
                            </span>
                            <button
                                onClick={() => navigate(-1)}
                                className="text-[#1a1a1a]/35 dark:text-foreground/35 hover:text-[#1a1a1a] dark:hover:text-foreground transition-colors text-[12px]"
                                style={{
                                    fontFamily: "'Kalam', cursive",
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '3px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                ← go back
                            </button>
                            <span
                                className="text-[#1a1a1a]/20 dark:text-foreground/20 tracking-[0.2em] text-[9px] sm:text-xsmall"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                LATER N COMIX PUBLISHING
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <span
                        className="text-muted-foreground/30 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        LATER N COMIX PUBLISHING
                    </span>
                    <span
                        className="text-muted-foreground/30 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        VOL. 01
                    </span>
                </div>
            </div>
        </>
    )
}
