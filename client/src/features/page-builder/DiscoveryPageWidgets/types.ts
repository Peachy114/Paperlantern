
import type { ChapterItem, WorkItem } from '@/features/work/hooks/useHome'

export 
interface DiscoveryWidgetData {
    hero: WorkItem[]
    weeklyChart: WorkItem[]
    todayReleases: WorkItem[]
    todayTopViews: WorkItem[]
    todayTopLikes: WorkItem[]
    freshReleases: WorkItem[]
    latestChapters: ChapterItem[]
    dailyWorks: WorkItem[]
    popularWorks: WorkItem[]
    topLikedWorks: WorkItem[]
    cover: (path: string | null, variant?: 'sm') => string | null
}