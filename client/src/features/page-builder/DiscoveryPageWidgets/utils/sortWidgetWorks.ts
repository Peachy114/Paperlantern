import type {  WorkItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'
import { compareWidgetSort } from './compareWidgetSort'

export function sortWidgetWorks(works: WorkItem[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...works].sort((a, b) => {
        for (const sort of sorts) {
            const value = compareWidgetSort(a, b, sort)
            if (value !== 0) return value
        }

        return 0
    })
}