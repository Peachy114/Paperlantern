import { useRef, useState, useEffect } from 'react'
import { usePublicChapterShow } from '@/features/work/hooks/usePublicChapterShow'
import type { ChapterListItem } from '@/types/chapter'
import Scroll from '@/components/ui/scroll'
import { useWallet, unlockChapter } from '@/hooks/useWallet'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import UnlockModal from '@/components/shared/UnlockModalChapter'

import PublicShowHeader from './PublicShowHeader'
import PublicShowWebtoonContent from './PublicShowWebtoonContent'
import PublicShowNovelContent from './PublicShowNovelContent'
import PublicShowLikes from './PublicShowLikes'
import PublicShowNavButtons from './PublicShowNavButtons'
import CommentSection from '@/features/comments/components/CommentSection'
import SuperLikeButton from '@/features/comments/components/SuperLikeButton'

export default function PublicShowView() {
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
        isOwner,
    } = usePublicChapterShow()

    const { token } = useAuthStore()
    const { openLogin } = useModalStore()
    const { wallet, refetch: refetchWallet } = useWallet()
    const queryClient = useQueryClient()

    const contentRef = useRef<HTMLDivElement>(null)
    const [showBottomNav, setShowBottomNav] = useState(false)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [unlocking, setUnlocking] = useState(false)
    const [unlockModal, setUnlockModal] = useState<{
        open: boolean
        chapterSlug: string | null
        chapterTitle: string
        creditsRequired: number
        navigateTo: string | null
    }>({ open: false, chapterSlug: null, chapterTitle: '', creditsRequired: 0, navigateTo: null })

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

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const openUnlockModal = (chapter: ChapterListItem, navigateTo: string) => {
        if (!token) {
            openLogin()
            return
        }
        setUnlockModal({
            open: true,
            chapterSlug: chapter.slug,
            chapterTitle: chapter.title,
            creditsRequired: chapter.credits_required ?? 0,
            navigateTo,
        })
    }

    const handleConfirmUnlock = async () => {
        if (!unlockModal.chapterSlug) return
        setUnlocking(true)
        try {
            const result = await unlockChapter(unlockModal.chapterSlug)
            if (result.success) {
                refetchWallet()
                queryClient.invalidateQueries({ queryKey: ['chapter', slug] })
                setUnlockModal((m) => ({ ...m, open: false }))
                if (unlockModal.navigateTo) goTo(unlockModal.navigateTo)
            }
        } catch {
        } finally {
            setUnlocking(false)
        }
    }

    return (
        <>
            <Scroll />

            {/* Scroll progress bar */}
            <div className="fixed top-0 left-0 right-0 h-0.5 bg-border z-50">
                <div
                    className="h-full bg-amber-400 transition-all duration-75"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            <UnlockModal
                open={unlockModal.open}
                onClose={() => setUnlockModal((m) => ({ ...m, open: false }))}
                onConfirm={handleConfirmUnlock}
                chapterTitle={unlockModal.chapterTitle}
                creditsRequired={unlockModal.creditsRequired}
                userBalance={wallet?.balance ?? 0}
                unlocking={unlocking}
            />

            <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 mt-20" ref={contentRef}>
                <PublicShowHeader
                    title={chapter.title}
                    order={chapter.order}
                    workType={chapter.work_type}
                    createdAt={chapter.created_at}
                    slug={slug ?? ''}
                    navigate={navigate}
                />

                <PublicShowNavButtons
                    prevChapter={prevChapter}
                    nextChapter={nextChapter}
                    isOwner={isOwner}
                    goTo={goTo}
                    openUnlockModal={openUnlockModal}
                />

                {chapter.work_type === 'webtoon' ? (
                    <PublicShowWebtoonContent images={chapter.images} imageUrl={imageUrl} />
                ) : (
                    <PublicShowNovelContent content={chapter.content} />
                )}

                <PublicShowLikes liked={liked} likes={likes} toggleLike={toggleLike} />

                <div className="mt-4 flex justify-end">
                    <SuperLikeButton
                        targetType="chapter"
                        targetId={chapter.id}
                        initialCount={chapter.super_likes_count ?? 0}
                        ownerUserId={chapter.work_user_id}
                    />
                </div>

                <div className="mt-6">
                    <CommentSection
                        targetType="chapter"
                        targetId={chapter.id}
                        artistUsername={chapter.artist_username}
                        title="Chapter comments"
                    />
                </div>

                {showBottomNav && (
                    <PublicShowNavButtons
                        prevChapter={prevChapter}
                        nextChapter={nextChapter}
                        isOwner={isOwner}
                        goTo={goTo}
                        openUnlockModal={openUnlockModal}
                    />
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <span className="text-xs text-muted-foreground tracking-widest uppercase">
                        Later N Comix
                    </span>
                    <span className="text-xs text-muted-foreground">Ch. {chapter.order}</span>
                </div>
            </div>
        </>
    )
}
