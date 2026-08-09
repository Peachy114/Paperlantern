import type { PageWidget } from '@/types/pageLayout'
import type { Art } from '@/types/art'
import type { CommissionService } from '@/types/commission'
import type { ChapterItem, WorkItem } from '@/features/work/hooks/useHome'

// Page preview filtering ----
export function applyPreviewWidgetFilters(works: WorkItem[], widget: PageWidget) {
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

    return sortPreviewWorks(filtered, widget)
}

export function sortPreviewWorks(works: WorkItem[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...works].sort((a, b) => {
        for (const sort of sorts) {
            const value = comparePreviewSort(a, b, sort)
            if (value !== 0) return value
        }

        return 0
    })
}

export function comparePreviewSort(a: WorkItem, b: WorkItem, sort: string) {
    if (sort === 'featured') return Number(b.is_featured) - Number(a.is_featured)
    if (sort === 'likes') return (b.likes ?? 0) - (a.likes ?? 0)
    if (sort === 'views' || sort === 'popular') return (b.views ?? 0) - (a.views ?? 0)
    if (sort === 'new' || sort === 'latest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    }
    return 0
}

export function matchesDateWindow(value: string | undefined, widget: PageWidget) {
    const mode = widget.settings.date_mode ?? 'all'
    const dateValue = widget.settings.date_value || widget.settings.daily_date
    if (mode === 'all' || !value) return true

    const date = new Date(value)
    const base = dateValue ? new Date(dateValue) : new Date()
    if (Number.isNaN(date.getTime()) || Number.isNaN(base.getTime())) return true

    if (mode === 'daily') return date.toISOString().slice(0, 10) === base.toISOString().slice(0, 10)
    if (mode === 'weekly')
        return Math.abs(date.getTime() - base.getTime()) <= 7 * 24 * 60 * 60 * 1000
    if (mode === 'monthly') {
        return (
            date.getUTCFullYear() === base.getUTCFullYear() &&
            date.getUTCMonth() === base.getUTCMonth()
        )
    }

    return true
}

export function filterPreviewChapters(chapters: ChapterItem[], widget: PageWidget) {
    const source = widget.settings.filter_cards_data ?? 'mixed'

    return chapters.filter((chapter) => {
        if (!matchesDateWindow(chapter.created_at, widget)) return false
        if (source === 'comix') return chapter.work.type === 'webtoon'
        if (source === 'novels') return chapter.work.type === 'wattpad'
        return true
    })
}

export function labelItemsFromWorks(works: WorkItem[]) {
    const counts = new Map<string, number>()

    works.forEach((work) => {
        ;(work.genres ?? []).forEach((label) => {
            const clean = label.trim()
            if (!clean) return
            counts.set(clean, (counts.get(clean) ?? 0) + 1)
        })
    })

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([label, count]) => ({ label, count }))
}

export function sourceFilteredPreviewWorks(works: WorkItem[], widget: PageWidget) {
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

// Widget : WorkGrid ----

export function applyPreviewArtFilters(arts: Art[], widget: PageWidget) {
    const settings = widget.settings ?? {}
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = (settings.label_filter_values ?? [])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()

    return arts.filter((art) => {
        if (!matchesDateWindow(art.created_at, widget)) return false
        const matches = (source: string, value: string) => {
            if (!value || source === 'none') return true
            if (source === 'status') return String(art.status ?? '').toLowerCase() === value
            if (source === 'genre' || source === 'label') {
                return (art.labels ?? []).some((label) => label.toLowerCase() === value)
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
}

export function applyPreviewCommissionFilters(commissions: CommissionService[], widget: PageWidget) {
    const settings = widget.settings ?? {}
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = (settings.label_filter_values ?? [])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()

    return commissions.filter((commission) => {
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
}

// ============================================================================
// SECTION 9: SHARED PREVIEW COMPONENTS ----
// ============================================================================
