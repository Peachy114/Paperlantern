import { useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import type { Chapter, ChapterListItem } from '@/types/chapter'

export function usePublicChapterShow() {
    const { workId, chapterId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // Chapter + chapters list
    const { data } = useSuspenseQuery({
        queryKey: ['chapter', workId, chapterId],
        queryFn: async () => {
            const [chapterRes, chaptersRes] = await Promise.all([
                publicApi.getChapter(Number(workId), Number(chapterId)),
                publicApi.getChapters(Number(workId)),
            ])
            const current = chapterRes.data
            const all: ChapterListItem[] = chaptersRes.data
            const idx = all.findIndex((c: ChapterListItem) => c.id === current.id)
            return {
                chapter: current as Chapter,
                prevId: idx > 0 ? all[idx - 1].id : null,
                prevChapter: idx > 0 ? all[idx - 1] : null,
                nextId: idx < all.length - 1 ? all[idx + 1].id : null,
                nextChapter: idx < all.length - 1 ? all[idx + 1] : null,
            }
        },
    })

    // Like status
    const { data: likeData } = useQuery({
        queryKey: ['like', workId, chapterId],
        queryFn: () =>
            publicApi.getLikeStatus(Number(workId), Number(chapterId)).then((r) => r.data),
    })

    // Record view (fire and forget)
    useQuery({
        queryKey: ['view', workId, chapterId],
        queryFn: () => publicApi.recordView(Number(workId), Number(chapterId)).catch(() => {}),
    })

    const toggleLike = async () => {
        try {
            const res = await publicApi.toggleLike(Number(workId), Number(chapterId))
            queryClient.setQueryData(['like', workId, chapterId], res.data)
        } catch {}
    }

    const goTo = (id: number) => navigate(`/comics/${workId}/chapters/${id}`)

    return {
        chapter: data.chapter,
        prevId: data.prevId,
        nextId: data.nextId,
        nextChapter: data.nextChapter,
        prevChapter: data.prevChapter,
        workId: Number(workId),
        navigate,
        goTo,
        imageUrl: (path: string) => storageUrl(path),
        liked: likeData?.liked ?? false,
        likes: likeData?.likes ?? 0,
        toggleLike,
    }
}
