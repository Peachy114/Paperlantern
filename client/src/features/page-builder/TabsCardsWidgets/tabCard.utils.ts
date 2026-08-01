import { type TabCardItem } from './types'
import type { WorkItem } from '@/features/work/hooks/useHome'
import { storageUrl } from '@/utils/storage'
import type { PageWidget } from '@/types/pageLayout'


export function filterItems(works: WorkItem[], widget: PageWidget): TabCardItem[] {
    const source = widget.settings.filter_cards_data ?? 'mixed'

    return works
        .filter((work) => work.type !== 'commission')
        .filter((work) => matchesDateWindow(work.created_at, widget))
        .filter((work) => {
            if (source === 'mixed') {
                return true
            }

            if (source === 'comix') {
                return work.type === 'webtoon'
            }

            if (source === 'novels') {
                return work.type === 'wattpad'
            }

            if (source === 'arts') {
                return work.type === 'art'
            }

            return true
        }) as TabCardItem[]
}

export function uniqueItems(items: TabCardItem[]) {
    const seen = new Set<string>()

    return items.filter((item) => {
        const key = `${item.type}-${item.slug || item.id}`

        if (seen.has(key)) {
            return false
        }

        seen.add(key)

        return true
    })
}

export function sortItems(items: TabCardItem[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...items].sort((a, b) => {
        for (const sort of sorts) {
            const result = compareBySort(a, b, sort)

            if (result !== 0) {
                return result
            }
        }

        return 0
    })
}

export function compareBySort(a: TabCardItem, b: TabCardItem, sort: string) {
    if (sort === 'featured') {
        return Number(b.is_featured) - Number(a.is_featured)
    }

    if (sort === 'likes') {
        return (b.likes ?? 0) - (a.likes ?? 0)
    }

    if (sort === 'views' || sort === 'popular') {
        return (b.views ?? 0) - (a.views ?? 0)
    }

    if (sort === 'new' || sort === 'latest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    }

    return 0
}

export function labelOptions(items: TabCardItem[]) {
    const counts = new Map<string, number>()

    items.forEach((item) => {
        ;(item.genres ?? []).forEach((label) => {
            counts.set(label, (counts.get(label) ?? 0) + 1)
        })
    })

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 16)
        .map(([label]) => label)
}

export function imageFor(item: TabCardItem) {
    return item.cover ? storageUrl(item.cover, item.type === 'art' ? undefined : 'sm') : null
}

export function hrefFor(item: TabCardItem) {
    return item.type === 'art'
        ? `/explore/arts?art=${encodeURIComponent(item.slug || item.id)}`
        : `/works/${item.slug || item.id}`
}

export function getTypeLabel(type: TabCardItem['type']) {
    if (type === 'art') {
        return 'Art'
    }

    if (type === 'wattpad') {
        return 'Novel'
    }

    return 'Webtoon'
}

export function getEventLabel(item: TabCardItem) {
    if (item.boosted_until) {
        return 'Event'
    }

    if (item.is_featured) {
        return 'Featured'
    }

    return null
}

export function getStatusLabel(item: TabCardItem) {
    if (!item.status) {
        return null
    }

    const value = item.status.trim()

    if (!value) {
        return null
    }

    return value.charAt(0).toUpperCase() + value.slice(1)
}

export function isNewItem(createdAt?: string) {
    if (!createdAt) {
        return false
    }

    const createdDate = new Date(createdAt)

    if (Number.isNaN(createdDate.getTime())) {
        return false
    }

    const thirtyDays = 30 * 24 * 60 * 60 * 1000

    const difference = Date.now() - createdDate.getTime()

    return difference >= 0 && difference <= thirtyDays
}

export function formatCount(value: number) {
    return new Intl.NumberFormat('en', {
        notation: value >= 1000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
    }).format(value)
}

export function matchesDateWindow(value: string | undefined, widget: PageWidget) {
    const mode = widget.settings.date_mode ?? 'all'

    const dateValue = widget.settings.date_value || widget.settings.daily_date

    if (mode === 'all' || !value) {
        return true
    }

    const date = new Date(value)
    const base = dateValue ? new Date(dateValue) : new Date()

    if (Number.isNaN(date.getTime()) || Number.isNaN(base.getTime())) {
        return true
    }

    if (mode === 'daily') {
        return date.toISOString().slice(0, 10) === base.toISOString().slice(0, 10)
    }

    if (mode === 'weekly') {
        return Math.abs(date.getTime() - base.getTime()) <= 7 * 24 * 60 * 60 * 1000
    }

    if (mode === 'monthly') {
        return (
            date.getUTCFullYear() === base.getUTCFullYear() &&
            date.getUTCMonth() === base.getUTCMonth()
        )
    }

    return true
}
