import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'
import { storageUrl } from '@/utils/storage'
import type { PageLayout } from '@/types/pageLayout'
import { SAMPLE_CHAPTERS, SAMPLE_WORKS, withSampleList } from '@/features/page-builder/samplePageData'

export interface WorkItem {
    id: string
    slug: string
    title: string
    cover: string | null
    banner: string | null
    description?: string
    type: 'webtoon' | 'wattpad' | 'art' | 'commission'
    content_type?: 'work' | 'chapter' | 'art' | 'commission'
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
    is_featured?: boolean
    boosted_until?: string | null
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

export function useHome(options: { preview?: boolean } = {}) {
    const preview = Boolean(options.preview)
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
        hero: preview ? withSampleList(data?.hero, SAMPLE_WORKS) : data?.hero ?? [],
        weeklyChart: preview ? withSampleList(data?.weeklyChart, SAMPLE_WORKS) : data?.weeklyChart ?? [],
        todayReleases: preview
            ? withSampleList(data?.todayReleases, SAMPLE_WORKS.slice(0, 2))
            : data?.todayReleases ?? [],
        todayTopViews: preview ? withSampleList(data?.todayTopViews, SAMPLE_WORKS) : data?.todayTopViews ?? [],
        todayTopLikes: preview ? withSampleList(data?.todayTopLikes, SAMPLE_WORKS) : data?.todayTopLikes ?? [],
        freshReleases: preview ? withSampleList(data?.freshReleases, SAMPLE_WORKS) : data?.freshReleases ?? [],
        latestChapters: preview
            ? withSampleList(data?.latestChapters, SAMPLE_CHAPTERS)
            : data?.latestChapters ?? [],
        dailyWorks: preview ? withSampleList(data?.dailyWorks, SAMPLE_WORKS) : data?.dailyWorks ?? [],
        popularWorks: preview ? withSampleList(data?.popularWorks, SAMPLE_WORKS) : data?.popularWorks ?? [],
        topLikedWorks: preview ? withSampleList(data?.topLikedWorks, SAMPLE_WORKS) : data?.topLikedWorks ?? [],
        layout: data?.layout,
        isLoading,
        cover,
    }
}
