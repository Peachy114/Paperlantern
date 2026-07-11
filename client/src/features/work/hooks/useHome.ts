import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'
import { storageUrl } from '@/utils/storage'

export interface WorkItem {
    id: string
    slug: string
    title: string
    cover: string | null
    banner: string | null
    description?: string
    type: 'webtoon' | 'wattpad'
    genres?: string[]
    views?: number
    likes?: number
    weekly_views?: number
    created_at?: string
    status?: 'draft' | 'ongoing' | 'completed' | 'hiatus'
}

export interface ChapterItem {
    id: string
    work_id: string
    title: string
    cover: string | null
    order: number
    created_at: string
    work: {
        id: string
        slug: string
        title: string
        cover: string | null
        type: 'webtoon' | 'wattpad'
    }
}

export function useHome() {
    const { data, isLoading } = useQuery({
        queryKey: ['home'],
        queryFn: async () => {
            const res = await api.get('/public/home')

            // helper: force array safety
            const toArray = <T>(value: any): T[] => {
                if (Array.isArray(value)) return value
                if (Array.isArray(value?.data)) return value.data
                return []
            }

            return {
                hero: toArray<WorkItem>(res.data?.hero),
                weeklyChart: toArray<WorkItem>(res.data?.weeklyChart),
                freshReleases: toArray<WorkItem>(res.data?.freshReleases),
                latestChapters: toArray<ChapterItem>(res.data?.latestChapters),
            }
        },
        staleTime: 60_000,
    })

    const cover = (path: string | null, variant?: 'sm') => (path ? storageUrl(path, variant) : null)

    return {
        hero: data?.hero ?? [],
        weeklyChart: data?.weeklyChart ?? [],
        freshReleases: data?.freshReleases ?? [],
        latestChapters: data?.latestChapters ?? [],
        isLoading,
        cover,
    }
}
