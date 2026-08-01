import type { WorkItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'

export function sourceFilteredWorks(works: WorkItem[], widget: PageWidget) {
    const source = widget.settings.filter_cards_data ?? 'mixed'

    return works.filter((work) => {
        if (source === 'comix') return work.type === 'webtoon'
        if (source === 'novels') return work.type === 'wattpad'
        if (source === 'arts') return work.type === 'art'
        if (source === 'shop' || source === 'commissions' || source === 'announcements')
            return false
        return work.type !== 'commission'
    })
}