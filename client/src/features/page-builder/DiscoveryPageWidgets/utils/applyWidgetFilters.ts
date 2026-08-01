import type { WorkItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'
import { matchesDateWindow } from './matchesDateWindow'
import { sortWidgetWorks } from './sortWidgetWorks'

export function applyWidgetFilters(works: WorkItem[], widget: PageWidget) {
    const settings = widget.settings ?? {}
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = (settings.label_filter_values ?? [])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()

    const filtered = works.filter((work) => {
        if (!matchesDateWindow(work.created_at, widget)) return false
        const matches = (source: string, value: string) => {
            if (!value || source === 'none') return true
            if (source === 'status') return String(work.status ?? '').toLowerCase() === value
            if (source === 'genre' || source === 'label') {
                return (work.genres ?? []).some((genre) => genre.toLowerCase() === value)
            }
            return source !== 'commission_type'
        }

        const multiOk =
            multiSource === 'none' || multiValues.length === 0
                ? true
                : multiValues.some((value) => matches(multiSource, value))
        const badgeOk =
            badgeSource === 'none' || !badgeValue ? true : matches(badgeSource, badgeValue)

        return multiOk && badgeOk
    })

    return sortWidgetWorks(filtered, widget)
}