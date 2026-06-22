// pages/StudioTrash.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useStudioTrash } from '../hooks/useStudioTrash'
import { storageUrl } from '@/utils/storage'
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

type ConfirmAction =
    | { type: 'restore-work'; slug: string; title: string }
    | { type: 'force-work'; slug: string; title: string }
    | { type: 'restore-chapter'; slug: string; title: string }
    | { type: 'force-chapter'; slug: string; title: string }
    | null

export default function StudioTrash() {
    const navigate = useNavigate()
    const { works, chapters, restoreWork, forceDeleteWork, restoreChapter, forceDeleteChapter } =
        useStudioTrash()

    const [confirm, setConfirm] = useState<ConfirmAction>(null)
    const [acting, setActing] = useState(false)

    const daysLeft = (deletedAt: string) => {
        const deleted = new Date(deletedAt)
        const expires = new Date(deleted.getTime() + 15 * 24 * 60 * 60 * 1000)
        const diff = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return Math.max(0, diff)
    }

    const handleConfirm = async () => {
        if (!confirm) return
        setActing(true)
        try {
            if (confirm.type === 'restore-work') {
                await restoreWork(confirm.slug)
                toast.success(`"${confirm.title}" restored.`)
            } else if (confirm.type === 'force-work') {
                await forceDeleteWork(confirm.slug)
                toast.success(`"${confirm.title}" permanently deleted.`)
            } else if (confirm.type === 'restore-chapter') {
                await restoreChapter(confirm.slug)
                toast.success(`"${confirm.title}" restored.`)
            } else if (confirm.type === 'force-chapter') {
                await forceDeleteChapter(confirm.slug)
                toast.success(`"${confirm.title}" permanently deleted.`)
            }
        } catch {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setActing(false)
            setConfirm(null)
        }
    }

    const isEmpty = works.length === 0 && chapters.length === 0

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
                rel="stylesheet"
            />

            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
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
                            TRASH
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
                                    🗑 TRASH
                                </h1>
                                <p
                                    className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[12px] sm:text-small"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    items are permanently deleted after 15 days
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/studio')}
                                className="shrink-0 border-[2.5px] border-[#1a1a1a] dark:border-foreground text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-amber-400 dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 sm:px-4 py-1.5 sm:py-2 cursor-pointer text-[12px] sm:text-normal"
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    letterSpacing: '0.12em',
                                    boxShadow: '2px 2px 0 #1a1a1a',
                                }}
                            >
                                ← STUDIO
                            </button>
                        </div>

                        {isEmpty ? (
                            <div
                                className="px-4 py-16 text-center bg-[#fffdf5] dark:bg-[#1c1a17]"
                                style={{ fontFamily: "'Kalam', cursive", color: '#888' }}
                            >
                                <p className="text-2xl mb-2">🎉</p>
                                <p>Your trash is empty.</p>
                            </div>
                        ) : (
                            <>
                                {/* Works section */}
                                {works.length > 0 && (
                                    <>
                                        <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:pl-14 sm:pr-5 py-3 flex items-center justify-between">
                                            <span
                                                className="text-white text-[12px] sm:text-normal tracking-[0.18em]"
                                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                            >
                                                ◆ DELETED WORKS
                                            </span>
                                            <div
                                                className="px-2 py-1 -rotate-[1.5deg] text-[10px] sm:text-xsmall shrink-0"
                                                style={{
                                                    background: '#fca5a5',
                                                    fontFamily: "'Kalam', cursive",
                                                    color: '#1a1a1a',
                                                    boxShadow: '1px 2px 4px rgba(0,0,0,0.25)',
                                                }}
                                            >
                                                {works.length} work{works.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>

                                        <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                                            <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
                                            {works.map((work, i) => {
                                                const days = daysLeft(work.deleted_at)
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
                                                            style={{
                                                                fontFamily: "'Kalam', cursive",
                                                            }}
                                                        >
                                                            {String(i + 1).padStart(2, '0')}
                                                        </span>

                                                        {/* Cover */}
                                                        <div className="w-10 h-14 sm:w-14 sm:h-20 flex-shrink-0 bg-[#d4cfc2] border border-black/10 overflow-hidden flex items-center justify-center text-black/20 opacity-60">
                                                            {work.cover ? (
                                                                <img
                                                                    src={storageUrl(work.cover)!}
                                                                    alt={work.title}
                                                                    className="w-full h-full object-cover grayscale"
                                                                />
                                                            ) : (
                                                                <span className="text-sub-title">
                                                                    ◻
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0 text-start">
                                                            <div
                                                                className="text-[#1a1a1a]/60 dark:text-foreground/60 truncate text-[13px] sm:text-normal line-through"
                                                                style={{
                                                                    fontFamily:
                                                                        "'Bebas Neue', sans-serif",
                                                                    letterSpacing: '0.05em',
                                                                }}
                                                            >
                                                                {work.title}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                <span
                                                                    className="inline-block px-1.5 py-0.5 text-[10px] sm:text-xsmall bg-indigo-100 text-indigo-800"
                                                                    style={{
                                                                        fontFamily:
                                                                            "'Kalam', cursive",
                                                                    }}
                                                                >
                                                                    {work.type === 'webtoon'
                                                                        ? 'Webtoon'
                                                                        : 'Novel'}
                                                                </span>
                                                                <span
                                                                    className="inline-block px-1.5 py-0.5 text-[10px] sm:text-xsmall"
                                                                    style={{
                                                                        fontFamily:
                                                                            "'Kalam', cursive",
                                                                        background:
                                                                            days <= 3
                                                                                ? '#fca5a5'
                                                                                : '#fef08a',
                                                                        color: '#1a1a1a',
                                                                        boxShadow:
                                                                            '1px 1px 2px rgba(0,0,0,0.08)',
                                                                    }}
                                                                >
                                                                    {days}d left
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                                            <button
                                                                onClick={() =>
                                                                    setConfirm({
                                                                        type: 'restore-work',
                                                                        slug: work.slug,
                                                                        title: work.title,
                                                                    })
                                                                }
                                                                className="border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 py-1 cursor-pointer text-[10px] sm:text-xsmall"
                                                                style={{
                                                                    fontFamily:
                                                                        "'Bebas Neue', sans-serif",
                                                                    letterSpacing: '0.1em',
                                                                    boxShadow:
                                                                        '1.5px 1.5px 0 #1a1a1a',
                                                                }}
                                                            >
                                                                RESTORE
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setConfirm({
                                                                        type: 'force-work',
                                                                        slug: work.slug,
                                                                        title: work.title,
                                                                    })
                                                                }
                                                                className="border-[2px] border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-400 transition-colors duration-100 px-2.5 py-1 cursor-pointer text-[10px] sm:text-xsmall"
                                                                style={{
                                                                    fontFamily:
                                                                        "'Bebas Neue', sans-serif",
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
                                    </>
                                )}

                                {/* Chapters section */}
                                {chapters.length > 0 && (
                                    <>
                                        <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:pl-14 sm:pr-5 py-3 flex items-center justify-between border-t-[2px] border-[#1a1a1a]">
                                            <span
                                                className="text-white text-[12px] sm:text-normal tracking-[0.18em]"
                                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                            >
                                                ◆ DELETED CHAPTERS
                                            </span>
                                            <div
                                                className="px-2 py-1 rotate-[1deg] text-[10px] sm:text-xsmall shrink-0"
                                                style={{
                                                    background: '#fca5a5',
                                                    fontFamily: "'Kalam', cursive",
                                                    color: '#1a1a1a',
                                                    boxShadow: '1px 2px 4px rgba(0,0,0,0.25)',
                                                }}
                                            >
                                                {chapters.length} chapter
                                                {chapters.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>

                                        <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                                            <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
                                            {chapters.map((chapter, i) => {
                                                const days = daysLeft(chapter.deleted_at)
                                                return (
                                                    <div
                                                        key={chapter.slug}
                                                        className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-4 py-3 transition-colors duration-100 hover:bg-amber-400/[0.07] ${
                                                            i % 2 === 0
                                                                ? 'bg-[#fffdf5] dark:bg-[#1c1a17]'
                                                                : 'bg-[#faf8ee] dark:bg-[#191713]'
                                                        }`}
                                                    >
                                                        <span
                                                            className="hidden sm:block absolute left-0 w-10 text-right pr-2.5 text-[#1a1a1a]/20 dark:text-foreground/20 text-xsmall"
                                                            style={{
                                                                fontFamily: "'Kalam', cursive",
                                                            }}
                                                        >
                                                            {String(i + 1).padStart(2, '0')}
                                                        </span>

                                                        {/* Cover */}
                                                        <div className="w-10 h-14 sm:w-14 sm:h-20 flex-shrink-0 bg-[#d4cfc2] border border-black/10 overflow-hidden flex items-center justify-center text-black/20 opacity-60">
                                                            {chapter.cover ? (
                                                                <img
                                                                    src={storageUrl(chapter.cover)!}
                                                                    alt={chapter.title}
                                                                    className="w-full h-full object-cover grayscale"
                                                                />
                                                            ) : (
                                                                <span className="text-sub-title">
                                                                    ◻
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0 text-start">
                                                            <div
                                                                className="text-[#1a1a1a]/60 dark:text-foreground/60 truncate text-[13px] sm:text-normal line-through"
                                                                style={{
                                                                    fontFamily:
                                                                        "'Bebas Neue', sans-serif",
                                                                    letterSpacing: '0.05em',
                                                                }}
                                                            >
                                                                {chapter.title}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                <span
                                                                    className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] sm:text-xsmall"
                                                                    style={{
                                                                        fontFamily:
                                                                            "'Noto Serif', serif",
                                                                    }}
                                                                >
                                                                    from{' '}
                                                                    <span className="italic">
                                                                        {chapter.work_title}
                                                                    </span>
                                                                </span>
                                                                <span className="text-[#1a1a1a]/20 text-[10px]">
                                                                    ·
                                                                </span>
                                                                <span
                                                                    className="inline-block px-1.5 py-0.5 text-[10px] sm:text-xsmall"
                                                                    style={{
                                                                        fontFamily:
                                                                            "'Kalam', cursive",
                                                                        background:
                                                                            days <= 3
                                                                                ? '#fca5a5'
                                                                                : '#fef08a',
                                                                        color: '#1a1a1a',
                                                                        boxShadow:
                                                                            '1px 1px 2px rgba(0,0,0,0.08)',
                                                                    }}
                                                                >
                                                                    {days}d left
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                                            <button
                                                                onClick={() =>
                                                                    setConfirm({
                                                                        type: 'restore-chapter',
                                                                        slug: chapter.slug,
                                                                        title: chapter.title,
                                                                    })
                                                                }
                                                                className="border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 py-1 cursor-pointer text-[10px] sm:text-xsmall"
                                                                style={{
                                                                    fontFamily:
                                                                        "'Bebas Neue', sans-serif",
                                                                    letterSpacing: '0.1em',
                                                                    boxShadow:
                                                                        '1.5px 1.5px 0 #1a1a1a',
                                                                }}
                                                            >
                                                                RESTORE
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setConfirm({
                                                                        type: 'force-chapter',
                                                                        slug: chapter.slug,
                                                                        title: chapter.title,
                                                                    })
                                                                }
                                                                className="border-[2px] border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-400 transition-colors duration-100 px-2.5 py-1 cursor-pointer text-[10px] sm:text-xsmall"
                                                                style={{
                                                                    fontFamily:
                                                                        "'Bebas Neue', sans-serif",
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
                                    </>
                                )}
                            </>
                        )}

                        {/* Footer */}
                        <div className="relative px-3 sm:pl-14 sm:pr-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
                            <span
                                className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px] sm:text-xsmall"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                auto-deleted after 15 days
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
            </div>

            {/* Confirm dialog */}
            <AlertDialog
                open={confirm !== null}
                onOpenChange={(open) => {
                    if (!open) setConfirm(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm?.type.startsWith('restore')
                                ? 'Restore this item?'
                                : 'Permanently delete?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm?.type.startsWith('restore')
                                ? `"${confirm?.title}" will be restored and visible again.`
                                : `"${confirm?.title}" will be permanently deleted and cannot be recovered.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={acting}
                            className={
                                confirm?.type.startsWith('restore')
                                    ? 'bg-foreground text-background hover:opacity-90'
                                    : 'bg-red-500 text-white hover:bg-red-600 border-red-600 shadow-[2px_2px_0_#7f1d1d]'
                            }
                        >
                            {acting
                                ? '...'
                                : confirm?.type.startsWith('restore')
                                  ? 'Restore'
                                  : 'Delete forever'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
