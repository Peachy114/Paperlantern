import { useNavigate, useParams } from 'react-router-dom'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { studioApi } from '@/api/studio'

export interface Chapter {
    slug: string
    work_id: number
    title: string
    content: string | null
    order: number
    status: 'draft' | 'scheduled' | 'published'
    cover: string | null
    scheduled_at: string | null
    is_locked: boolean
    credits_required: number
    views: number
    likes: number
    created_at: string
}

export interface Work {
    slug: string
    title: string
    type: 'webtoon' | 'wattpad'
    cover: string | null
    banner: string | null
}
export function useChapterIndex() {
    const { workSlug } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: work } = useSuspenseQuery<Work>({
        queryKey: ['studio-work', workSlug],
        queryFn: () => studioApi.getWork(workSlug!).then((res) => res.data),
    })

    const { data: chapters } = useSuspenseQuery<Chapter[]>({
        queryKey: ['studio-chapters', workSlug],
        queryFn: () => studioApi.getChapters(workSlug!).then((res) => res.data),
    })

    const handleDelete = async (chapterSlug: string) => {
        await studioApi.deleteChapter(workSlug!, chapterSlug)
        queryClient.setQueryData<Chapter[]>(
            ['studio-chapters', workSlug],
            (prev) => prev?.filter((c) => c.slug !== chapterSlug) ?? []
        )
    }

    return {
        work,
        chapters,
        navigate,
        workSlug,
        handleDelete,
    }
}
