import { useSuspenseQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import api from '@/api/axios'
import { storageUrl } from '@/utils/storage'

export interface ComicItem {
    id: number
    slug: string
    title: string
    cover: string | null
    type: string
    genres: string[]
    views: number
    likes: number
    status: string
    created_at: string
    chapters_count: number
}

export function useComics(type: 'webtoon' | 'wattpad' = 'webtoon') {
    const [searchParams] = useSearchParams()

    const day = searchParams.get('day')
    const status = searchParams.get('status')
    const genre = searchParams.get('genre')
    const isRankings = searchParams.get('view') === 'rankings'

    const params = new URLSearchParams()
    params.set('type', type)
    if (day) params.set('day', day)
    if (status) params.set('status', status)
    if (genre) params.set('genre', genre)
    if (isRankings) params.set('sort', 'rankings')

    const { data } = useSuspenseQuery({
        queryKey: ['comics', type, day, status, genre, isRankings],
        queryFn: () => api.get(`/public/comics?${params.toString()}`).then((r) => r.data),
    })

    const cover = (path: string | null) => (path ? storageUrl(path) : null)

    return {
        comics: (data.data ?? []) as ComicItem[],
        total: (data.total ?? 0) as number,
        cover,
        day,
        status,
        genre,
        isRankings,
    }
}
