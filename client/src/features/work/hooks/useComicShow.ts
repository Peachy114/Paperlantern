import { useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '@/api/public'
import { useAuthStore } from '@/store/authStore'
import { storageUrl } from '@/utils/storage'
import { useSuspenseQuery } from '@tanstack/react-query'

interface Chapter {
    id: string
    slug: string
    title: string
    order: number
    status: string
    is_locked: boolean
    credits_required: number
    likes: number
    created_at: string
    cover: string | null
}

interface Work {
    id: string
    user_id: string
    title: string
    description: string | null
    type: 'webtoon' | 'wattpad'
    genres: string[]
    cover: string | null
    banner: string | null
    status: string
    views: number
    likes: number
    work_likes_count?: number
    favorites_count?: number
    comments_count?: number
    super_likes_count?: number
    super_like_credits?: number
    chapters_count: number
    user?: { id: string; name: string; username?: string | null }
}

export function useComicShow() {
    const { slug } = useParams() // changed from workId
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)

    const { data } = useSuspenseQuery({
        queryKey: ['comic', slug, user?.id ?? 'guest'],
        queryFn: async () => {
            const [workRes, chaptersRes] = await Promise.all([
                publicApi.getWork(slug!), // string now
                publicApi.getChapters(slug!), // string now
            ])
            return {
                work: { ...workRes.data, chapters_count: chaptersRes.data.length } as Work,
                chapters: chaptersRes.data as Chapter[],
            }
        },
        refetchOnWindowFocus: true,
    })

    const isOwner = user?.id === data?.work?.user_id
    const coverUrl = (path: string | null, variant?: 'sm') =>
        path ? storageUrl(path, variant) : null

    return {
        work: data.work,
        chapters: data.chapters,
        isOwner,
        navigate,
        slug,
        coverUrl,
    }
}
