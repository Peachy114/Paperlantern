import { useRef, useState, useEffect } from 'react'
import { usePublicChapterShow } from '@/features/work/hooks/usePublicChapterShow'
import type { ChapterListItem } from '@/types/chapter'
import Scroll from '@/components/ui/scroll'
import { useWallet, unlockChapter } from '@/hooks/useWallet'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import UnlockModal from '@/components/shared/UnlockModalChapter'

export default function ComicChapter() {
    const {
        chapter,
        prevChapter,
        nextChapter,
        slug,
        navigate,
        goTo,
        imageUrl,
        liked,
        likes,
        toggleLike,
    } = usePublicChapterShow()

    const { token } = useAuthStore()
    const { openLogin } = useModalStore()
    const { wallet, refetch: refetchWallet } = useWallet()
    const queryClient = useQueryClient()

    const contentRef = useRef<HTMLDivElement>(null)
    const [showBottomNav, setShowBottomNav] = useState(false)
    const [unlocking, setUnlocking] = useState(false)
    const [unlockModal, setUnlockModal] = useState<{
        open: boolean
        chapterId: number | null
        chapterTitle: string
        creditsRequired: number
        navigateTo: string | null
    }>({ open: false, chapterId: null, chapterTitle: '', creditsRequired: 0, navigateTo: null })

    useEffect(() => {
        if (!contentRef.current) return
        const check = () => {
            if (contentRef.current) {
                setShowBottomNav(contentRef.current.offsetHeight > window.innerHeight * 1.2)
            }
        }
        check()
        const observer = new ResizeObserver(check)
        observer.observe(contentRef.current)
        return () => observer.disconnect()
    }, [chapter])

    const openUnlockModal = (chapter: ChapterListItem, navigateTo: string) => {
        if (!token) {
            openLogin()
            return
        }
        setUnlockModal({
            open: true,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            creditsRequired: chapter.credits_required ?? 0,
            navigateTo,
        })
    }

    const handleConfirmUnlock = async () => {
        if (!unlockModal.chapterId) return
        setUnlocking(true)
        try {
            const result = await unlockChapter(unlockModal.chapterId)
            if (result.success) {
                refetchWallet()
                queryClient.invalidateQueries({ queryKey: ['chapter', slug] })
                setUnlockModal((m) => ({ ...m, open: false }))
                if (unlockModal.navigateTo) {
                    goTo(unlockModal.navigateTo)
                }
            }
        } catch {
            // error
        } finally {
            setUnlocking(false)
        }
    }

    const NavButtons = ({
        nextChapter,
        prevChapter,
    }: {
        nextChapter: ChapterListItem | null
        prevChapter: ChapterListItem | null
    }) => (
        <div className="flex items-center justify-between py-2.5 gap-2">
            {/* PREV */}
            {prevChapter ? (
                prevChapter.is_locked ? (
                    <button
                        onClick={() => openUnlockModal(prevChapter, prevChapter.slug)}
                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 bg-amber-400 border-[2px] border-foreground text-[#1a1a1a] hover:-translate-x-px hover:-translate-y-px transition-transform duration-100 text-left"
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(11px, 3vw, 14px)',
                            letterSpacing: '0.1em',
                            boxShadow: '2px 2px 0 var(--foreground)',
                        }}
                    >
                        🔒{' '}
                        <span className="hidden xs:inline">
                            {prevChapter.credits_required} CREDITS TO{' '}
                        </span>
                        UNLOCK
                    </button>
                ) : (
                    <button
                        onClick={() => goTo(prevChapter.slug)}
                        className="px-3 sm:px-4 py-2 border-[2px] border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-100"
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(11px, 3vw, 14px)',
                            letterSpacing: '0.15em',
                            boxShadow: '2px 2px 0 var(--foreground)',
                        }}
                    >
                        ← PREV
                    </button>
                )
            ) : (
                <div />
            )}

            {/* NEXT */}
            {nextChapter ? (
                nextChapter.is_locked ? (
                    <button
                        onClick={() => openUnlockModal(nextChapter, nextChapter.slug)}
                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 bg-amber-400 border-[2px] border-foreground text-[#1a1a1a] hover:-translate-x-px hover:-translate-y-px transition-transform duration-100 text-right"
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(11px, 3vw, 14px)',
                            letterSpacing: '0.1em',
                            boxShadow: '2px 2px 0 var(--foreground)',
                        }}
                    >
                        🔒{' '}
                        <span className="hidden xs:inline">
                            {nextChapter.credits_required} CREDITS TO{' '}
                        </span>
                        UNLOCK
                    </button>
                ) : (
                    <button
                        onClick={() => goTo(nextChapter.slug)}
                        className="px-3 sm:px-4 py-2 border-[2px] border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-100"
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(11px, 3vw, 14px)',
                            letterSpacing: '0.15em',
                            boxShadow: '2px 2px 0 var(--foreground)',
                        }}
                    >
                        NEXT →
                    </button>
                )
            ) : (
                <div />
            )}
        </div>
    )

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
                rel="stylesheet"
            />
            <Scroll />

            <UnlockModal
                open={unlockModal.open}
                onClose={() => setUnlockModal((m) => ({ ...m, open: false }))}
                onConfirm={handleConfirmUnlock}
                chapterTitle={unlockModal.chapterTitle}
                creditsRequired={unlockModal.creditsRequired}
                userBalance={wallet?.balance ?? 0}
                unlocking={unlocking}
            />

            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8" ref={contentRef}>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-5 border-b-[2.5px] border-[#1a1a1a] dark:border-foreground/40 gap-2">
                    <button
                        onClick={() => navigate(`/comics/${slug}`)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: '11px',
                            letterSpacing: '0.2em',
                        }}
                    >
                        ← BACK
                    </button>

                    <div className="w-px h-4 bg-foreground/20 shrink-0" />

                    <div className="flex-1 min-w-0 text-center">
                        <span
                            className="text-amber-500 block"
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 'clamp(9px, 2.5vw, 11px)',
                                letterSpacing: '0.2em',
                            }}
                        >
                            ◆ {chapter.work_type === 'webtoon' ? 'WEBTOON' : 'NOVEL'} · CH.
                            {chapter.order}
                        </span>
                        <h1
                            className="text-foreground leading-none truncate"
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 'clamp(16px, 4vw, 32px)',
                                letterSpacing: '0.04em',
                            }}
                        >
                            {chapter.title}
                        </h1>
                    </div>

                    <span
                        className="hidden sm:block text-muted-foreground/40 shrink-0 ml-2"
                        style={{ fontFamily: "'Kalam', cursive", fontSize: '11px' }}
                    >
                        {new Date(chapter.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </span>
                </div>

                {/* Mobile date */}
                <div className="sm:hidden text-center mb-3">
                    <span
                        className="text-muted-foreground/40"
                        style={{ fontFamily: "'Kalam', cursive", fontSize: '10px' }}
                    >
                        {new Date(chapter.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </span>
                </div>

                {/* TOP NAV — always visible */}
                {/* <NavButtons nextChapter={nextChapter} prevChapter={prevChapter} /> */}

                {/* Webtoon images */}
                {chapter.work_type === 'webtoon' && (
                    <div className="flex flex-col rounded-lg sm:rounded-xl overflow-hidden bg-zinc-950 my-4 sm:my-5">
                        {chapter.images.length === 0 ? (
                            <div className="flex items-center justify-center py-24 text-small text-zinc-500">
                                No images uploaded.
                            </div>
                        ) : (
                            chapter.images.map((img) => (
                                <img
                                    key={img.id}
                                    src={imageUrl(img.path)!}
                                    alt={`Page ${img.order + 1}`}
                                    className="w-full block"
                                    draggable={false}
                                    loading="eager"
                                />
                            ))
                        )}
                    </div>
                )}

                {/* Novel content */}
                {chapter.work_type === 'wattpad' && (
                    <div className="rounded-xl sm:rounded-2xl bg-zinc-50 dark:bg-[#080808] px-4 sm:px-8 py-6 sm:py-10 my-4 sm:my-5 text-start">
                        {chapter.content ? (
                            <p
                                className="leading-loose text-foreground whitespace-pre-wrap break-words"
                                style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}
                            >
                                {chapter.content}
                            </p>
                        ) : (
                            <p className="text-small text-muted-foreground italic text-center py-16">
                                No content yet.
                            </p>
                        )}
                    </div>
                )}

                {/* Like button */}
                <div className="flex flex-col items-center gap-1.5 py-4 sm:py-5">
                    <button
                        onClick={toggleLike}
                        className="flex items-center gap-2 transition-colors duration-150 group"
                        style={{
                            fontFamily: "'Kalam', cursive",
                            fontSize: 'clamp(12px, 3vw, 13px)',
                        }}
                    >
                        <span
                            className={`text-lg transition-colors duration-150 ${liked ? 'text-red-400' : 'text-muted-foreground group-hover:text-red-400'}`}
                        >
                            {liked ? '♥' : '♡'}
                        </span>
                        <span
                            className={`transition-colors duration-150 ${liked ? 'text-muted-foreground/50' : 'text-muted-foreground group-hover:text-muted-foreground/50'}`}
                        >
                            {liked ? (
                                'thank you for the love!'
                            ) : (
                                <>
                                    <span className="hidden xs:inline">
                                        if you enjoyed this, leave a like
                                    </span>
                                    <span className="xs:hidden">leave a like!</span>
                                </>
                            )}
                        </span>
                    </button>
                    <span
                        className="text-muted-foreground/50"
                        style={{
                            fontFamily: "'Kalam', cursive",
                            fontSize: 'clamp(11px, 3vw, 13px)',
                        }}
                    >
                        {likes.toLocaleString()} liked this chapter
                    </span>
                </div>

                {/* BOTTOM NAV — only if page is long */}
                {showBottomNav && (
                    <NavButtons nextChapter={nextChapter} prevChapter={prevChapter} />
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 px-1">
                    <span
                        className="text-muted-foreground/40 text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em]"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        LATER N COMIX PUBLISHING
                    </span>
                    <span
                        className="text-muted-foreground/40 text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em]"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        VOL. 01 · CH. {chapter.order}
                    </span>
                </div>
            </div>
        </>
    )
}
