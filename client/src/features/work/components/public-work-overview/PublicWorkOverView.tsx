import { useState } from 'react'
import { useComicShow } from '@/features/work/hooks/useComicShow'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { useWallet, unlockChapter } from '@/hooks/useWallet'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Heart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import UnlockModal from '@/components/shared/UnlockModalChapter'

import PublicWorkHeader from './PublicWorkHeader'
import PublicWorkInfo from './PublicWorkInfo'
import PublicWorkChapterList from './PublicWorkChapterList'
import CommentSection from '@/features/comments/components/CommentSection'
import SuperLikeButton from '@/features/comments/components/SuperLikeButton'
import { publicApi } from '@/api/public'
import { Button } from '@/components/ui/button'

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

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 mt-15">
                {/* Banner — full width */}
                <PublicWorkHeader work={work} coverUrl={coverUrl} />

                {/* Below banner: stacked on mobile, 2-col on desktop */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
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
                </div>

                {work?.id && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <WorkEngagementButtons
                                slug={slug ?? ''}
                                initialLikeCount={work.work_likes_count ?? 0}
                                initialFavoriteCount={work.favorites_count ?? 0}
                            />
                            <SuperLikeButton
                                targetType="work"
                                targetId={work.id}
                                initialCount={work.super_likes_count ?? 0}
                                ownerUserId={work.user_id}
                            />
                        </div>
                        <CommentSection
                            targetType="work"
                            targetId={work.id}
                            artistUsername={work.user?.username}
                            title={`${work.title} comments`}
                        />
                    </div>
                )}
            </div>
        </>
    )
}

interface WorkEngagement {
    liked: boolean
    favorited: boolean
    work_likes_count: number
    favorites_count: number
}

function WorkEngagementButtons({
    slug,
    initialLikeCount,
    initialFavoriteCount,
}: {
    slug: string
    initialLikeCount: number
    initialFavoriteCount: number
}) {
    const { token } = useAuthStore()
    const { openLogin } = useModalStore()
    const queryClient = useQueryClient()
    const queryKey = ['work-engagement', slug]

    const fallback: WorkEngagement = {
        liked: false,
        favorited: false,
        work_likes_count: initialLikeCount,
        favorites_count: initialFavoriteCount,
    }

    const { data = fallback } = useQuery<WorkEngagement>({
        queryKey,
        queryFn: () => publicApi.getWorkEngagement(slug).then((res) => res.data),
        enabled: Boolean(slug),
        initialData: fallback,
    })

    const mergeEngagement = (next: Partial<WorkEngagement>) => {
        queryClient.setQueryData<WorkEngagement>(queryKey, (current) => ({
            ...(current ?? fallback),
            ...next,
        }))
    }

    const likeMutation = useMutation({
        mutationFn: () => publicApi.toggleWorkLike(slug).then((res) => res.data),
        onSuccess: (result) => mergeEngagement(result),
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not update like.')
        },
    })

    const favoriteMutation = useMutation({
        mutationFn: () => publicApi.toggleWorkFavorite(slug).then((res) => res.data),
        onSuccess: (result) => mergeEngagement(result),
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not update favorite.')
        },
    })

    const requireLogin = () => {
        if (token) return true
        openLogin()
        return false
    }

    return (
        <>
            <Button
                type="button"
                size="sm"
                variant={data.favorited ? 'default' : 'outline'}
                onClick={() => {
                    if (requireLogin()) favoriteMutation.mutate()
                }}
                disabled={favoriteMutation.isPending}
            >
                {favoriteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Bookmark className={`h-4 w-4 ${data.favorited ? 'fill-current' : ''}`} />
                )}
                Favorite
                <span className="text-xs opacity-75">{data.favorites_count.toLocaleString()}</span>
            </Button>

            <Button
                type="button"
                size="sm"
                variant={data.liked ? 'default' : 'outline'}
                onClick={() => {
                    if (requireLogin()) likeMutation.mutate()
                }}
                disabled={likeMutation.isPending}
            >
                {likeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Heart className={`h-4 w-4 ${data.liked ? 'fill-current' : ''}`} />
                )}
                Like
                <span className="text-xs opacity-75">{data.work_likes_count.toLocaleString()}</span>
            </Button>
        </>
    )
}
