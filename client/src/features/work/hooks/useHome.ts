import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'
import { storageUrl } from '@/utils/storage'
import type { PageLayout } from '@/types/pageLayout'

export interface WorkItem {
    id: string
    slug: string
    title: string
    cover: string | null
    banner: string | null
    description?: string
    type: 'webtoon' | 'wattpad' | 'art'
    content_type?: 'work' | 'chapter' | 'art'
    chapter_slug?: string | null
    release_title?: string | null
    chapter_order?: number | null
    genres?: string[]
    views?: number
    likes?: number
    period_views?: number
    period_likes?: number
    weekly_views?: number
    created_at?: string
    status?: 'draft' | 'ongoing' | 'completed' | 'hiatus' | 'published'
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
                todayReleases: toArray<WorkItem>(res.data?.todayReleases ?? res.data?.dailyWorks),
                todayTopViews: toArray<WorkItem>(res.data?.todayTopViews),
                todayTopLikes: toArray<WorkItem>(res.data?.todayTopLikes),
                freshReleases: toArray<WorkItem>(res.data?.freshReleases),
                latestChapters: toArray<ChapterItem>(res.data?.latestChapters),
                dailyWorks: toArray<WorkItem>(res.data?.dailyWorks),
                popularWorks: toArray<WorkItem>(res.data?.popularWorks),
                topLikedWorks: toArray<WorkItem>(res.data?.topLikedWorks),
                layout: res.data?.layout as PageLayout | undefined,
            }
        },
        staleTime: 0,
        refetchOnMount: 'always',
    })

    const cover = (path: string | null, variant?: 'sm') => (path ? storageUrl(path, variant) : null)

    return {
        hero: data?.hero ?? [],
        weeklyChart: data?.weeklyChart ?? [],
        todayReleases: data?.todayReleases ?? [],
        todayTopViews: data?.todayTopViews ?? [],
        todayTopLikes: data?.todayTopLikes ?? [],
        freshReleases: data?.freshReleases ?? [],
        latestChapters: data?.latestChapters ?? [],
        dailyWorks: data?.dailyWorks ?? [],
        popularWorks: data?.popularWorks ?? [],
        topLikedWorks: data?.topLikedWorks ?? [],
        layout: data?.layout,
        isLoading,
        cover,
    }
}
