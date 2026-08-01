import type { CommissionService } from '@/types/commission'
import type { PageWidget } from '@/types/pageLayout'
import { matchesDateWindow } from './matchesDateWindow'
import { sortCommissions } from './sortCommissions'


export function applyCommissionWidgetFilters(commissions: CommissionService[], widget: PageWidget) {
    const settings = widget.settings ?? {}
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = (settings.label_filter_values ?? [])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()

    const filtered = commissions.filter((commission) => {
        if (!matchesDateWindow(commission.created_at, widget)) return false
        const matches = (source: string, value: string) => {
            if (!value || source === 'none') return true
            if (source === 'status') return String(commission.status ?? '').toLowerCase() === value
            if (source === 'commission_type') {
                return (
                    commission.category?.name?.toLowerCase() === value ||
                    commission.category?.slug?.toLowerCase() === value
                )
            }
            return true
        }
        const multiOk =
            multiSource === 'none' || multiValues.length === 0
                ? true
                : multiValues.some((value) => matches(multiSource, value))
        const badgeOk =
            badgeSource === 'none' || !badgeValue ? true : matches(badgeSource, badgeValue)
        return multiOk && badgeOk
    })

    return sortCommissions(filtered, widget)
}