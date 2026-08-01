import type { CommissionService } from '@/types/commission'
import type { PageWidget } from '@/types/pageLayout'
import { compareCommissionSort } from './compareCommissionSort'

export function sortCommissions(commissions: CommissionService[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...commissions].sort((a, b) => {
        for (const sort of sorts) {
            const value = compareCommissionSort(a, b, sort)
            if (value !== 0) return value
        }

        return 0
    })
}