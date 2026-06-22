import { useSuspenseQuery } from '@tanstack/react-query'
import api from '@/api/axios'
import { storageUrl } from '@/utils/storage'

export interface WorkItem {
    id: number
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
    id: number
    work_id: number
    title: string
    cover: string | null
    order: number
    created_at: string
    work: {
        id: number
        slug: string
        title: string
        cover: string | null
        type: 'webtoon' | 'wattpad'
    }
}

export function useHome() {
    const { data } = useSuspenseQuery({
        queryKey: ['home'],
        queryFn: async () => {
            const [heroRes, chartRes, freshRes, latestRes] = await Promise.all([
                api.get('/public/hero'),
                api.get('/public/weekly-chart'),
                api.get('/public/fresh-releases'),
                api.get('/public/latest-chapters'),
            ])

            // helper: force array safety
            const toArray = <T>(value: any): T[] => {
                if (Array.isArray(value)) return value
                if (Array.isArray(value?.data)) return value.data
                return []
            }

            return {
                hero: toArray<WorkItem>(heroRes.data),
                weeklyChart: toArray<WorkItem>(chartRes.data),
                freshReleases: toArray<WorkItem>(freshRes.data),
                latestChapters: toArray<ChapterItem>(latestRes.data),
            }
        },
    })

    const cover = (path: string | null) => (path ? storageUrl(path) : null)

    return {
        hero: data?.hero ?? [],
        weeklyChart: data?.weeklyChart ?? [],
        freshReleases: data?.freshReleases ?? [],
        latestChapters: data?.latestChapters ?? [],
        cover,
    }
}
