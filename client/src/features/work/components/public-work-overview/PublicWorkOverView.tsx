import { useState } from 'react'
import { useComicShow } from '@/features/work/hooks/useComicShow'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { useWallet, unlockChapter } from '@/hooks/useWallet'
import { useQueryClient } from '@tanstack/react-query'
import UnlockModal from '@/components/shared/UnlockModalChapter'

import PublicWorkHeader from './PublicWorkHeader'
import PublicWorkInfo from './PublicWorkInfo'
import PublicWorkChapterList from './PublicWorkChapterList'

export default function PublicWorkOverview() {
    const { work, chapters, isOwner, navigate, coverUrl, slug } = useComicShow()
    const { token, user } = useAuthStore()
    const { openLogin } = useModalStore()
    const { wallet, refetch: refetchWallet } = useWallet()
    const queryClient = useQueryClient()
    const [unlocking, setUnlocking] = useState(false)

    const [unlockModal, setUnlockModal] = useState<{
        open: boolean
        chapterSlug: string | null
        chapterTitle: string
        creditsRequired: number
    }>({ open: false, chapterSlug: null, chapterTitle: '', creditsRequired: 0 })

    const openUnlockModal = (
        chapterSlug: string,
        chapterTitle: string,
        creditsRequired: number
    ) => {
        if (!token) {
            openLogin()
            return
        }
        setUnlockModal({ open: true, chapterSlug, chapterTitle, creditsRequired })
    }

    const handleConfirmUnlock = async () => {
        if (!unlockModal.chapterSlug) return
        setUnlocking(true)
        try {
            const chapter = chapters.find((c) => c.slug === unlockModal.chapterSlug)
            if (!chapter) return
            const result = await unlockChapter(chapter.slug)
            if (result.success) {
                refetchWallet()
                queryClient.invalidateQueries({ queryKey: ['comic', slug, user?.id ?? 'guest'] })
                setUnlockModal((m) => ({ ...m, open: false }))
                navigate(`/works/${slug}/chapters/${unlockModal.chapterSlug}`)
            }
        } catch (e) {
            console.error('unlock error:', e)
        } finally {
            setUnlocking(false)
        }
    }

    const handleChapterClick = (chapter: any) => {
        if (!token) {
            openLogin()
            return
        }
        if (chapter.is_locked && !isOwner) {
            openUnlockModal(chapter.slug, chapter.title, chapter.credits_required ?? 0)
            return
        }
        navigate(`/works/${slug}/chapters/${chapter.slug}`)
    }

    return (
        <>
            <UnlockModal
                open={unlockModal.open}
                onClose={() => setUnlockModal((m) => ({ ...m, open: false }))}
                onConfirm={handleConfirmUnlock}
                chapterTitle={unlockModal.chapterTitle}
                creditsRequired={unlockModal.creditsRequired}
                userBalance={wallet?.balance ?? 0}
                unlocking={unlocking}
            />

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                {/* Banner — full width */}
                <PublicWorkHeader work={work} coverUrl={coverUrl} />

                {/* Below banner: stacked on mobile, 2-col on desktop */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Left — cover + info */}
                    <div className="w-full lg:w-[40%] lg:shrink-0">
                        <PublicWorkInfo
                            work={work}
                            isOwner={isOwner}
                            slug={slug ?? ''}
                            navigate={navigate}
                            coverUrl={coverUrl}
                        />
                    </div>

                    {/* Right — table of contents, grows to fill */}
                    <div className="w-full lg:w-[60%] min-w-0">
                        <PublicWorkChapterList
                            chapters={chapters}
                            coverUrl={coverUrl}
                            slug={slug ?? ''}
                            isOwner={isOwner}
                            onChapterClick={handleChapterClick}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}
