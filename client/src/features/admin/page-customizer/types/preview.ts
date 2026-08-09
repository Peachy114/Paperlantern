import type { Art } from '@/types/art'
import type { CommissionService } from '@/types/commission'
import type { ChapterItem, WorkItem } from '@/features/work/hooks/useHome'

// Home preview ----
export interface HomePreviewData {
    weeklyChart: WorkItem[]
    todayReleases: WorkItem[]
    todayTopViews: WorkItem[]
    todayTopLikes: WorkItem[]
    freshReleases: WorkItem[]
    latestChapters: ChapterItem[]
    dailyWorks: WorkItem[]
    popularWorks: WorkItem[]
    topLikedWorks: WorkItem[]
}

// Arts preview ----
export interface ArtsPreviewData {
    featured_artists: {
        id: string
        name: string
        username: string
        avatar: string | null
        artist_title: string | null
    }[]
    tags: { label: string; artists_count: number }[]
    arts: { data: Art[] }
}

// Commission preview ----
export interface CommissionPreviewData {
    commissions: { data: CommissionService[] }
}
