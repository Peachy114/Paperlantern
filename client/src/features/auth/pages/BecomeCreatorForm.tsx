// pages/BecomeCreator.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBecomeCreator } from '@/features/auth/hooks/useBecomeCreator'
import { useAuthStore } from '@/store/authStore'

const sections = [
    {
        number: '01',
        title: 'Content Standards',
        accentColor: '#f59e0b',
        sticky: { text: 'read carefully!', color: '#ffc6a6', rotate: '-2deg' },
        items: [
            {
                text: 'Comic-style drawn violence is permitted within reason — action scenes, dramatic battles, stylized gore are fine.',
                warn: false,
            },
            {
                text: 'Real photographs or realistic depictions of gore, murder, or graphic injury are strictly prohibited.',
                warn: true,
            },
            {
                text: 'Sexually explicit or suggestive content is not allowed — especially anything involving minors.',
                warn: true,
            },
            {
                text: 'Hate speech, discrimination, harassment, or content that targets individuals or groups is banned.',
                warn: true,
            },
            {
                text: 'Plagiarism is strictly forbidden. Only upload content you own or have rights to.',
                warn: false,
            },
        ],
    },
    {
        number: '02',
        title: 'Earnings & Credits',
        accentColor: '#f472b6',
        sticky: { text: 'sign at bottom ✍️', color: '#ffbacf', rotate: '1.5deg' },
        items: [
            {
                text: 'You earn credits when readers purchase access to your locked chapters.',
                warn: false,
            },
            {
                text: 'Later N Comix collects a platform fee from each transaction to keep the lights on.',
                warn: false,
            },
            {
                text: 'Earnings are withdrawable once you reach the minimum threshold set by Later N Comix.',
                warn: false,
            },
            {
                text: 'Fraudulent purchases or manipulation of the credit system will result in immediate account removal.',
                warn: true,
            },
        ],
    },
    {
        number: '03',
        title: 'Merchandise Advertising',
        accentColor: '#a78bfa',
        sticky: { text: 'important!!', color: '#c4b5fd', rotate: '-1deg' },
        items: [
            {
                text: 'You may place merchandise ads below your chapter images — promote your own stuff!',
                warn: false,
            },
            {
                text: 'Ads must be relevant to your work. No misleading, deceptive, or third-party promotions.',
                warn: false,
            },
            {
                text: 'Later N Comix reserves the right to remove any ad that violates community guidelines.',
                warn: false,
            },
        ],
    },
    {
        number: '04',
        title: 'Violations & Consequences',
        accentColor: '#fb923c',
        sticky: { text: 'got it? 👍', color: '#86efac', rotate: '2deg' },
        items: [
            {
                text: 'Minor violations (off-topic content, borderline material) may result in content removal or a temporary suspension.',
                warn: false,
            },
            {
                text: 'Severe violations — especially uploading real photographs of gore, murder, or graphic violence — will result in permanent account removal with no appeal.',
                warn: true,
            },
            {
                text: 'Repeated offenses of any kind escalate to permanent removal regardless of severity.',
                warn: true,
            },
            {
                text: 'Later N Comix reserves the right to update these terms at any time. Continued use means acceptance.',
                warn: false,
            },
        ],
    },
]

export default function BecomeCreator() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const [agreed, setAgreed] = useState(false)
    const [showWarning, setShowWarning] = useState(false)
    const { becomeCreator, loading, alreadyCreator } = useBecomeCreator()

    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true })
        }
    }, [user, navigate])

    if (!user) return null

    const handleSubmit = () => {
        if (!agreed) {
            setShowWarning(true)
            setTimeout(() => setShowWarning(false), 2500)
            return
        }
        becomeCreator()
    }

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
                            {/* Welcome sticky note — only shown when already a storyteller */}
                            {alreadyCreator && (
                                <div
                                    className="absolute -top-4 right-4 sm:right-8 z-30 px-3 sm:px-4 pt-5 pb-3 w-40 sm:w-48"
                                    style={{
                                        background: '#fef08a',
                                        boxShadow:
                                            '2px 4px 0 rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)',
                                        transform: 'rotate(2.5deg)',
                                        fontFamily: "'Kalam', cursive",
                                    }}
                                >
                                    {/* Tape */}
                                    <div
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 opacity-50"
                                        style={{
                                            background: 'rgba(251,191,36,0.5)',
                                            border: '1px solid rgba(0,0,0,0.08)',
                                        }}
                                    />
                                    <p className="text-[#1a1a1a] text-[18px] sm:text-[20px] leading-none mb-1">
                                        😊
                                    </p>
                                    <p
                                        className="text-[#1a1a1a] text-[13px] sm:text-[15px] leading-snug font-bold mb-1.5"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: '0.06em',
                                        }}
                                    >
                                        WELCOME, STORYTELLER!
                                    </p>
                                    <p className="text-[#1a1a1a]/70 text-[10px] sm:text-[11px] leading-snug mb-2">
                                        you're part of Later N Comix now. here's how to get started:
                                    </p>
                                    <ul className="text-[#1a1a1a]/80 text-[10px] sm:text-[11px] leading-relaxed flex flex-col gap-0.5">
                                        <li>✏️ create your first work</li>
                                        <li>📖 write chapters your way</li>
                                        <li>🔒 lock chapters to earn</li>
                                        <li>🌟 share with the world</li>
                                    </ul>
                                    <p className="mt-2 text-[#1a1a1a]/40 text-[9px]">
                                        — The Later N Comix Team 🏮
                                    </p>
                                </div>
                            )}

                            <p
                                className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px] tracking-[0.1em] mb-1"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                ◆ OFFICIAL_DOC · EST.2025 · CREATOR AGREEMENT
                            </p>
                            <h1
                                className="text-[#1a1a1a] dark:text-foreground leading-none"
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: 'clamp(26px, 6vw, 42px)',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                STORYTELLER AGREEMENT
                            </h1>
                            <p
                                className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[12px] sm:text-small"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                before publishing on paper lantern, read and agree to the following
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
                            <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-amber-300/50 dark:bg-amber-400/20 pointer-events-none z-10" />

                            {sections.map((section, si) => (
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
                                                    style={{
                                                        fontFamily: "'Noto Serif', serif",
                                                        color: item.warn ? '#92400e' : undefined,
                                                    }}
                                                >
                                                    {item.warn ? (
                                                        item.text
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

                        {/* ── Big sticky note warning ── */}
                        <div className="px-3 sm:px-5 py-6 flex justify-center bg-[#faf8ee] dark:bg-[#191713] border-t border-black/[0.06] dark:border-white/[0.06]">
                            <div
                                className="relative w-full max-w-sm px-5 pt-8 pb-6"
                                style={{
                                    background: '#fef08a',
                                    boxShadow:
                                        '3px 4px 0 rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)',
                                    transform: 'rotate(-1.2deg)',
                                    fontFamily: "'Kalam', cursive",
                                }}
                            >
                                {/* Tape strip across top */}
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
                                    READ BEFORE SIGNING
                                </p>
                                <p className="text-[#1a1a1a]/80 text-[12.5px] sm:text-[13.5px] leading-relaxed">
                                    We love our creators! But Later N Comix is a safe space for
                                    everyone. Uploading real gore, explicit content, or stolen work
                                    will get your account permanently removed — no warnings, no
                                    appeals. Keep it cool and we'll have a great time together! 🌟
                                </p>
                                <p
                                    className="mt-3 text-[#1a1a1a]/40 text-[11px]"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    — The Later N Comix Team
                                </p>
                            </div>
                        </div>

                        {/* Agreement / Sign */}
                        <div className="relative border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
                            <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-amber-300/50 dark:bg-amber-400/20 pointer-events-none" />

                            <div className="px-3 sm:pl-16 sm:pr-5 py-5 sm:py-6">
                                <p
                                    className="mb-5 text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px] sm:text-[12px] leading-loose tracking-[0.02em]"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    &gt; by checking the box below, you confirm that you have read,
                                    understood, and agreed to the paper lantern storyteller
                                    agreement. you are responsible for all content you publish.
                                </p>

                                {/* Checkbox */}
                                <label
                                    className={`flex items-start gap-3 mb-5 ${alreadyCreator ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                                >
                                    <div
                                        onClick={() => !alreadyCreator && setAgreed((a) => !a)}
                                        className={`mt-0.5 w-5 h-5 shrink-0 border-[2px] flex items-center justify-center transition-all duration-150 bg-transparent ${
                                            alreadyCreator
                                                ? 'border-amber-500/60 dark:border-amber-400/60 cursor-default'
                                                : agreed
                                                  ? 'border-amber-500 dark:border-amber-400 cursor-pointer'
                                                  : 'border-[#1a1a1a]/30 dark:border-foreground/30 cursor-pointer'
                                        }`}
                                    >
                                        {(agreed || alreadyCreator) && (
                                            <span
                                                style={{
                                                    fontFamily: "'Kalam', cursive",
                                                    fontSize: '13px',
                                                    color: '#f59e0b',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[13px] leading-relaxed ${agreed || alreadyCreator ? 'text-[#1a1a1a] dark:text-foreground' : 'text-[#1a1a1a]/70 dark:text-foreground/60'}`}
                                        style={{ fontFamily: "'Noto Serif', serif" }}
                                    >
                                        I have read and agree to the Later N Comix Storyteller
                                        Agreement. I understand that violations may result in
                                        permanent account removal.
                                    </span>
                                </label>

                                {/* Inline warning — amber instead of red */}
                                {showWarning && (
                                    <div
                                        className="mb-4 px-3 py-2 border-[2px] flex items-center gap-2"
                                        style={{
                                            borderColor: '#d97706',
                                            background: 'rgba(254,243,199,0.7)',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: "'Kalam', cursive",
                                                fontSize: '12px',
                                                color: '#92400e',
                                            }}
                                        >
                                            !
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: "'Kalam', cursive",
                                                fontSize: '12px',
                                                color: '#92400e',
                                            }}
                                        >
                                            please read and agree to the terms first
                                        </span>
                                    </div>
                                )}

                                {/* Signature button */}
                                <div className="flex items-end gap-4 sm:gap-6">
                                    <div className="flex flex-col items-start gap-1">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading || alreadyCreator}
                                            className={`relative group transition-all duration-150 ${alreadyCreator ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]'}`}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: 0,
                                            }}
                                        >
                                            {/* Paper slip */}
                                            <div
                                                className="px-5 sm:px-7 py-3 sm:py-4 bg-[#fefce8] dark:bg-[#2a2510] border-[1.5px] border-[#1a1a1a]/20 dark:border-foreground/20"
                                                style={{
                                                    boxShadow:
                                                        '2px 3px 0 rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
                                                    transform: 'rotate(-0.6deg)',
                                                }}
                                            >
                                                {/* Signature text */}
                                                <span
                                                    className="block text-[#1a1a1a] dark:text-foreground/90 text-[22px] sm:text-[26px] leading-none"
                                                    style={{
                                                        fontFamily: "'Kalam', cursive",
                                                        fontWeight: 700,
                                                        letterSpacing: '-0.01em',
                                                    }}
                                                >
                                                    {loading
                                                        ? 'signing...'
                                                        : alreadyCreator
                                                          ? 'already signed ✓'
                                                          : 'sign & become a storyteller'}
                                                </span>
                                                {/* Underline rule like a signature line */}
                                                <div className="mt-2 h-[1.5px] bg-[#1a1a1a]/30 dark:bg-foreground/25" />
                                                <p
                                                    className="mt-1 text-[10px] text-[#1a1a1a]/35 dark:text-foreground/35"
                                                    style={{ fontFamily: "'Kalam', cursive" }}
                                                >
                                                    {alreadyCreator
                                                        ? 'you are already a storyteller'
                                                        : 'by signing you agree to the terms above'}
                                                </p>
                                            </div>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => navigate(-1)}
                                        className="text-[#1a1a1a]/35 dark:text-foreground/35 hover:text-[#1a1a1a] dark:hover:text-foreground transition-colors text-[12px] mb-1"
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
                                </div>
                            </div>
                        </div>

                        {/* Footer bar */}
                        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
                            <span
                                className="text-[#1a1a1a]/25 dark:text-foreground/25 text-[10px] sm:text-xsmall tracking-[0.15em]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                STORYTELLER AGREEMENT · V1.0
                            </span>
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
