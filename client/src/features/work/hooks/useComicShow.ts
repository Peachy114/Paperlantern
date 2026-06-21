import { useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '@/api/public'
import { useAuthStore } from '@/store/authStore'
import { storageUrl } from '@/utils/storage'
import { useSuspenseQuery } from '@tanstack/react-query'

interface Chapter {
    id: number
    title: string
    order: number
    status: string
    is_locked: boolean
    credits_required: number
    likes: number
    created_at: string
}

interface Work {
    id: number
    user_id: number
    title: string
    description: string | null
    type: 'webtoon' | 'wattpad'
    genres: string[]
    cover: string | null
    banner: string | null
    status: string
    views: number
    likes: number
    chapters_count: number
    user?: { id: number; name: string }
}

export function useComicShow() {
    const { workId } = useParams()
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)

    const { data } = useSuspenseQuery({
        queryKey: ['comic', workId, user?.id ?? 'guest'],
        queryFn: async () => {
            const [workRes, chaptersRes] = await Promise.all([
                publicApi.getWork(Number(workId)),
                publicApi.getChapters(Number(workId)),
            ])
            return {
                work: { ...workRes.data, chapters_count: chaptersRes.data.length } as Work,
                chapters: chaptersRes.data as Chapter[],
            }
        },
        refetchOnWindowFocus: true,
    })

    const isOwner = user?.id === data?.work?.user_id
    const coverUrl = (path: string | null) => (path ? storageUrl(path) : null)

    return {
        work: data.work,
        chapters: data.chapters,
        isOwner,
        navigate,
        workId: Number(workId),
        coverUrl,
    }
}
