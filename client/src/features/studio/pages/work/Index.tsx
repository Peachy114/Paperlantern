// pages/StudioDashboard.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { useStudioDashboard } from '@/features/studio/hooks/useStudioDashboard'
import { storageUrl } from '@/utils/storage'
import CardStickyNotes from '@/features/studio/pages/CardStickyNotes'
import News from '@/components/layout/News'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 rotate-[-0.5deg]' },
    scheduled: { label: 'Scheduled', className: 'bg-yellow-100 text-yellow-800 rotate-[0.5deg]' },
    published: { label: 'Published', className: 'bg-green-200 text-green-900 rotate-[0.5deg]' },
    ongoing: { label: 'Ongoing', className: 'bg-sky-100 text-sky-800 rotate-[0.5deg]' },
}

export default function StudioDashboard() {
    const {
        works,
        showTypeSelect,
        selectedType,
        setShowTypeSelect,
        setSelectedType,
        handleDelete,
        handleConfirmType,
        navigate,
    } = useStudioDashboard()

    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    const totalChapters = works.reduce((s, w) => s + w.chapters_count, 0)
    const totalViews = works.reduce((s, w) => s + w.views, 0)

    const pendingWork = works.find((w) => w.slug === pendingDeleteId) ?? null

    const confirmDelete = async () => {
        if (pendingDeleteId === null) return
        setDeleting(true)
        try {
            await handleDelete(pendingDeleteId)
            toast.success('Work deleted.')
        } catch {
            toast.error('Failed to delete work. Please try again.')
        } finally {
            setDeleting(false)
            setPendingDeleteId(null)
        }
    }

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
                rel="stylesheet"
            />

            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
                <News audience="studio" />
                <CardStickyNotes />

                <div className="flex gap-0 mb-6">
                    {/* Spine */}
                    <div
                        className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808]"
                        style={{ minHeight: '320px' }}
                    >
                        <span
                            className="text-amber-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            LATER N COMIX
                        </span>
                        <span
                            className="text-white/30 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            STUDIO
                        </span>
                    </div>

                    {/* Main content */}
                    <div
                        className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17]"
                        style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
                    >
                        {/* Header */}
                        <div className="border-b-[2.5px] border-[#000000] px-3 sm:px-5 py-3 sm:py-5 flex items-center justify-between gap-3 bg-[#fffdf5] dark:bg-[#1c1717]">
                            <div className="min-w-0">
                                <h1
                                    className="text-[#1a1a1a] dark:text-foreground leading-none"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: 'clamp(26px, 6vw, 38px)',
                                        letterSpacing: '0.04em',
                                    }}
                                >
                                    YOUR STUDIO
                                </h1>
                                <p
                                    className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[12px] sm:text-small"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    your works, your world
                                </p>
                            </div>

                            {/* Replace the single + NEW button with this */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate('/studio/earnings')}
                                    className="shrink-0 border-[2.5px] border-[#1a1a1a] dark:border-foreground text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-amber-400 dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 sm:px-4 py-1.5 sm:py-2 cursor-pointer text-[12px] sm:text-normal"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.12em',
                                        boxShadow: '2px 2px 0 #1a1a1a',
                                    }}
                                >
                                    $ EARNINGS
                                </button>
                                <button
                                    onClick={() => setShowTypeSelect(true)}
                                    className="shrink-0 border-[2.5px] border-[#1a1a1a] dark:border-foreground text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-amber-400 dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 sm:px-4 py-1.5 sm:py-2 cursor-pointer text-[12px] sm:text-normal"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.12em',
                                        boxShadow: '2px 2px 0 #1a1a1a',
                                    }}
                                >
                                    + NEW
                                </button>
                                <button
                                    onClick={() => navigate('/studio/trash')}
                                    className="shrink-0 border-[2.5px] border-[#1a1a1a] dark:border-foreground text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-amber-400 dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 sm:px-4 py-1.5 sm:py-2 cursor-pointer text-[12px] sm:text-normal"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.12em',
                                        boxShadow: '2px 2px 0 #1a1a1a',
                                    }}
                                >
                                    Trash
                                </button>
                            </div>
                        </div>

                        {/* Stats row — overflow-visible so sticky notes poke above the border */}
                        <div className="grid grid-cols-3 divide-x-[2px] divide-[#000000] border-b-[2px] border-[#1a1a1a] overflow-visible">
                            {[
                                {
                                    val: works.length,
                                    lbl: 'Works',
                                    sticky: 'you can do it!',
                                    color: '#ffc6a6',
                                    rotate: '2deg',
                                },
                                {
                                    val: totalChapters,
                                    lbl: 'Chapters',
                                    sticky: 'keep writing!',
                                    color: '#ffbacf',
                                    rotate: '-1.5deg',
                                },
                                {
                                    val: totalViews.toLocaleString(),
                                    lbl: 'Views',
                                    sticky: 'rooting for you',
                                    color: '#86efac',
                                    rotate: '1.5deg',
                                },
                            ].map(({ val, lbl, sticky, color, rotate }) => (
                                <div
                                    key={lbl}
                                    className="relative px-2 sm:px-5 pt-8 pb-4 sm:pt-9 sm:pb-5 bg-[#fff9f5] dark:bg-[#1c1a17]"
                                >
                                    {/* Sticky note — always shown, pokes above the row */}
                                    <div
                                        className="absolute -top-3 right-1 h-10 sm:right-3 px-1.5 sm:px-2.5 pt-3 py-0.5 text-[9px] sm:text-[11px] leading-tight z-20 whitespace-nowrap pointer-events-none"
                                        style={{
                                            background: color,
                                            fontFamily: "'Kalam', cursive",
                                            color: '#1a1a1a',
                                            boxShadow: '2px 3px 0 rgba(0,0,0,0.2)',
                                            transform: `rotate(${rotate})`,
                                        }}
                                    >
                                        {sticky}
                                    </div>
                                    <div
                                        className="text-[#1a1a1a] dark:text-foreground leading-none"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            fontSize: 'clamp(20px, 5vw, 32px)',
                                        }}
                                    >
                                        {val}
                                    </div>
                                    <div
                                        className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[9px] sm:text-xsmall tracking-[0.12em] sm:tracking-[0.18em]"
                                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                    >
                                        {lbl.toUpperCase()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TOC header */}
                        <div className="relative">
                            <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
                            <div className="bg-[#1a1a1a] dark:bg-[#2a2825] dark:border-b dark:border-white/10 px-3 sm:pl-14 sm:pr-5 py-3 flex items-center justify-between">
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
                                    {works.length} work{works.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Works list */}
                        {works.length === 0 ? (
                            <div className="relative">
                                <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 pointer-events-none z-10" />
                                <div
                                    className="px-4 sm:pl-14 sm:pr-5 py-12 text-center bg-[#fffdf5] dark:bg-[#1c1a17] text-normal"
                                    style={{ fontFamily: "'Kalam', cursive", color: '#888' }}
                                >
                                    No works yet...
                                    <br />
                                    <button
                                        onClick={() => setShowTypeSelect(true)}
                                        className="mt-4 border-[2px] border-[#1a1a1a] dark:border-foreground/60 px-4 py-1.5 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-amber-400 transition-colors duration-100 cursor-pointer text-normal"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: '0.12em',
                                        }}
                                    >
                                        CREATE YOUR FIRST WORK
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                                <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />

                                {works.map((work, i) => {
                                    const badge = STATUS_BADGE[work.status] ?? {
                                        label: work.status,
                                        className: 'bg-gray-100 text-gray-600',
                                    }
                                    return (
                                        <div
                                            key={work.slug}
                                            className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-4 py-3 transition-colors duration-100 hover:bg-amber-400/[0.07] ${
                                                i % 2 === 0
                                                    ? 'bg-[#fffdf5] dark:bg-[#1c1a17]'
                                                    : 'bg-[#faf8ee] dark:bg-[#191713]'
                                            }`}
                                        >
                                            <span
                                                className="hidden sm:block absolute left-0 w-10 text-right pr-2.5 text-[#1a1a1a]/20 dark:text-foreground/20 text-xsmall"
                                                style={{ fontFamily: "'Kalam', cursive" }}
                                            >
                                                {String(i + 1).padStart(2, '0')}
                                            </span>

                                            <div className="w-10 h-14 sm:w-14 sm:h-20 flex-shrink-0 bg-[#d4cfc2] border border-black/10 overflow-hidden flex items-center justify-center text-black/20">
                                                {work.cover ? (
                                                    <img
                                                        src={storageUrl(work.cover)!}
                                                        alt={work.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sub-title">◻</span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 text-start">
                                                <div
                                                    className="text-[#1a1a1a] dark:text-foreground truncate text-[13px] sm:text-normal"
                                                    style={{
                                                        fontFamily: "'Bebas Neue', sans-serif",
                                                        letterSpacing: '0.05em',
                                                    }}
                                                >
                                                    {work.title}
                                                </div>

                                                <div className="flex items-center gap-1 sm:gap-1.5 mt-1 flex-wrap">
                                                    <span
                                                        className="inline-block px-1.5 py-0.5 text-[10px] sm:text-xsmall bg-indigo-100 text-indigo-800"
                                                        style={{ fontFamily: "'Kalam', cursive" }}
                                                    >
                                                        {work.type === 'webtoon'
                                                            ? 'Webtoon'
                                                            : 'Novel'}
                                                    </span>
                                                    <span
                                                        className={`inline-block px-1.5 py-0.5 text-[10px] sm:text-xsmall ${badge.className}`}
                                                        style={{
                                                            fontFamily: "'Kalam', cursive",
                                                            boxShadow:
                                                                '1px 1px 2px rgba(0,0,0,0.08)',
                                                        }}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                    {work.genres.length > 0 && (
                                                        <span
                                                            className="hidden sm:inline text-xsmall text-[#1a1a1a]/50 dark:text-foreground/50 truncate"
                                                            style={{
                                                                fontFamily: "'Kalam', cursive",
                                                            }}
                                                        >
                                                            {work.genres.slice(0, 3).join(' · ')}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
                                                    <span
                                                        className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] sm:text-xsmall"
                                                        style={{
                                                            fontFamily: "'Noto Serif', serif",
                                                        }}
                                                    >
                                                        {work.chapters_count} ch
                                                    </span>
                                                    <span className="text-[#1a1a1a]/20 text-[10px]">
                                                        ·
                                                    </span>
                                                    <span
                                                        className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] sm:text-xsmall"
                                                        style={{
                                                            fontFamily: "'Noto Serif', serif",
                                                        }}
                                                    >
                                                        {work.views.toLocaleString()} views
                                                    </span>
                                                    <span className="hidden sm:inline text-[#1a1a1a]/20 text-xsmall">
                                                        ·
                                                    </span>
                                                    <span
                                                        className="hidden sm:inline text-[#1a1a1a]/40 dark:text-foreground/40 text-xsmall"
                                                        style={{
                                                            fontFamily: "'Noto Serif', serif",
                                                        }}
                                                    >
                                                        {(work.likes ?? 0).toLocaleString()} likes
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/studio/works/${work.slug}/chapters`
                                                        )
                                                    }
                                                    className="sm:hidden border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 w-8 h-8 flex items-center justify-center cursor-pointer"
                                                    style={{ boxShadow: '1.5px 1.5px 0 #1a1a1a' }}
                                                    title="Manage"
                                                >
                                                    <svg
                                                        width="13"
                                                        height="13"
                                                        viewBox="0 0 13 13"
                                                        fill="none"
                                                    >
                                                        <rect
                                                            x="1"
                                                            y="1"
                                                            width="11"
                                                            height="2"
                                                            rx="0.5"
                                                            fill="currentColor"
                                                        />
                                                        <rect
                                                            x="1"
                                                            y="5.5"
                                                            width="8"
                                                            height="2"
                                                            rx="0.5"
                                                            fill="currentColor"
                                                        />
                                                        <rect
                                                            x="1"
                                                            y="10"
                                                            width="5"
                                                            height="2"
                                                            rx="0.5"
                                                            fill="currentColor"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        navigate(`/studio/works/${work.slug}/edit`)
                                                    }
                                                    className="sm:hidden border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 w-8 h-8 flex items-center justify-center cursor-pointer"
                                                    style={{ boxShadow: '1.5px 1.5px 0 #1a1a1a' }}
                                                    title="Edit"
                                                >
                                                    <svg
                                                        width="13"
                                                        height="13"
                                                        viewBox="0 0 13 13"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M9 2L11 4L4.5 10.5H2.5V8.5L9 2Z"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setPendingDeleteId(work.slug)}
                                                    className="sm:hidden border-[2px] border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors duration-100 w-8 h-8 flex items-center justify-center cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <svg
                                                        width="11"
                                                        height="13"
                                                        viewBox="0 0 11 13"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M1 3H10M4 3V1.5H7V3M2 3L2.5 11H8.5L9 3H2Z"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/studio/works/${work.slug}/chapters`
                                                        )
                                                    }
                                                    className="hidden sm:block border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 py-1 cursor-pointer text-xsmall"
                                                    style={{
                                                        fontFamily: "'Bebas Neue', sans-serif",
                                                        letterSpacing: '0.1em',
                                                        boxShadow: '1.5px 1.5px 0 #1a1a1a',
                                                    }}
                                                >
                                                    MANAGE
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        navigate(`/studio/works/${work.slug}/edit`)
                                                    }
                                                    className="hidden sm:block border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 py-1 cursor-pointer text-xsmall"
                                                    style={{
                                                        fontFamily: "'Bebas Neue', sans-serif",
                                                        letterSpacing: '0.1em',
                                                        boxShadow: '1.5px 1.5px 0 #1a1a1a',
                                                    }}
                                                >
                                                    EDIT
                                                </button>
                                                <button
                                                    onClick={() => setPendingDeleteId(work.slug)}
                                                    className="hidden sm:block border-[2px] border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-400 dark:hover:border-red-600 transition-colors duration-100 px-2.5 py-1 cursor-pointer text-xsmall"
                                                    style={{
                                                        fontFamily: "'Bebas Neue', sans-serif",
                                                        letterSpacing: '0.1em',
                                                    }}
                                                >
                                                    DELETE
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="relative px-3 sm:pl-14 sm:pr-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
                            <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none" />
                            <span
                                className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px] sm:text-xsmall"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                {works.length} work{works.length !== 1 ? 's' : ''} total
                            </span>
                            <span
                                className="text-[#1a1a1a]/20 dark:text-foreground/20 tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-xsmall"
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

            {showTypeSelect && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-[#fffdf5] border-[2.5px] border-[#1a1a1a] w-full max-w-xs overflow-hidden"
                        style={{ boxShadow: '5px 5px 0 #1a1a1a' }}
                    >
                        <div className="bg-[#1a1a1a] px-5 py-4">
                            <h2
                                className="text-white leading-none tracking-[0.04em]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px' }}
                            >
                                NEW WORK
                            </h2>
                            <p
                                className="text-white/40 mt-1 text-small"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                what are you making?
                            </p>
                        </div>
                        <div className="p-5">
                            <div className="flex gap-3 mb-5">
                                {(['webtoon', 'wattpad'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                        className={`flex-1 py-3 border-[2px] transition-all duration-100 cursor-pointer text-normal ${
                                            selectedType === type
                                                ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                                                : 'border-[#d4cfc2] text-[#999] hover:border-[#888] hover:text-[#1a1a1a]'
                                        }`}
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: '0.08em',
                                        }}
                                    >
                                        {type === 'webtoon' ? 'WEBTOON' : 'NOVEL'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowTypeSelect(false)}
                                    className="flex-1 py-2 border-[2px] border-[#d4cfc2] text-[#999] hover:border-[#888] hover:text-[#1a1a1a] transition-colors duration-100 cursor-pointer text-small"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.1em',
                                    }}
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleConfirmType}
                                    className="flex-1 py-2 bg-[#1a1a1a] text-white hover:opacity-90 transition-opacity duration-100 border-[2px] border-[#1a1a1a] cursor-pointer text-small"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.1em',
                                    }}
                                >
                                    CONTINUE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            <AlertDialog
                open={pendingDeleteId !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDeleteId(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this work?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingWork
                                ? `"${pendingWork.title}" and all of its chapters will be permanently deleted. This action cannot be undone.`
                                : 'This action cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-red-500 text-white hover:bg-red-600 border-red-600 shadow-[2px_2px_0_#7f1d1d]"
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
