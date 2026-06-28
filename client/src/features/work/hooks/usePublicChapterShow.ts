import { useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import { useAuthStore } from '@/store/authStore'
import type { Chapter, ChapterListItem } from '@/types/chapter'

export function usePublicChapterShow() {
    const { slug, chapterSlug } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const user = useAuthStore((s) => s.user)

    const { data } = useSuspenseQuery({
        queryKey: ['chapter', slug, chapterSlug],
        queryFn: async () => {
            const [chapterRes, chaptersRes] = await Promise.all([
                publicApi.getChapter(slug!, chapterSlug!),
                publicApi.getChapters(slug!),
            ])
            const current = chapterRes.data
            const all: ChapterListItem[] = chaptersRes.data
            const idx = all.findIndex((c: ChapterListItem) => c.slug === chapterSlug)
            return {
                chapter: current as Chapter,
                prevChapter: idx > 0 ? all[idx - 1] : null,
                nextChapter: idx < all.length - 1 ? all[idx + 1] : null,
            }
        },
    })

    const { data: likeData } = useQuery({
        queryKey: ['like', slug, chapterSlug],
        queryFn: () => publicApi.getLikeStatus(slug!, chapterSlug!).then((r) => r.data),
    })

    useQuery({
        queryKey: ['view', slug, chapterSlug],
        queryFn: () => publicApi.recordView(slug!, chapterSlug!).catch(() => {}),
    })

    const toggleLike = async () => {
        try {
            const res = await publicApi.toggleLike(slug!, chapterSlug!)
            queryClient.setQueryData(['like', slug, chapterSlug], res.data)
        } catch {}
    }

    const goTo = (chapterSlug: string) => navigate(`/comics/${slug}/chapters/${chapterSlug}`)

    const isOwner = user?.id === data.chapter.work_user_id
    return {
        chapter: data.chapter,
        prevChapter: data.prevChapter,
        nextChapter: data.nextChapter,
        isOwner,
        slug,
        chapterSlug,
        navigate,
        goTo,
        imageUrl: (path: string) => storageUrl(path),
        liked: likeData?.liked ?? false,
        likes: likeData?.likes ?? 0,
        toggleLike,
    }
}
