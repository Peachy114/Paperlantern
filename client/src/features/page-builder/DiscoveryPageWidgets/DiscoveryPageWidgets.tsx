import { Suspense } from 'react'
import { useLocation } from 'react-router-dom'

import type { ChapterItem, WorkItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'
import DiscoveryWidget from './DiscoveryWidget'
import { labelItemsFromWorks } from './utils/labelItemsFromWorks'

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

export function DiscoveryPageWidgets({
    widgets,
    data,
}: {
    widgets: PageWidget[]
    data: DiscoveryWidgetData
}) {
    const location = useLocation()
    const contentFilter = new URLSearchParams(location.search).get('content')
    const enabledWidgets = widgets.filter((widget) => widget.enabled)
    const labelItems = labelItemsFromWorks([
        ...data.hero,
        ...data.weeklyChart,
        ...data.freshReleases,
        ...data.popularWorks,
        ...data.topLikedWorks,
    ])

    return (
        <Suspense fallback={null}>
            {enabledWidgets.map((widget) => (
                <DiscoveryWidget
                    key={widget.id}
                    widget={widget}
                    data={data}
                    contentFilter={contentFilter}
                    widgets={enabledWidgets}
                    labels={labelItems}
                />
            ))}
        </Suspense>
    )
}
