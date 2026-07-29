import { useMemo, useState } from 'react'
import { Eye, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { WorkItem } from '@/features/work/hooks/useHome'
import { useHome } from '@/features/work/hooks/useHome'
import { storageUrl } from '@/utils/storage'
import type { PageWidget } from '@/types/pageLayout'

type TabCardItem = WorkItem & {
    type: 'webtoon' | 'wattpad' | 'art'
}

export default function TabCardsWidget({
    widget,
    works,
    preview = false,
}: {
    widget: PageWidget
    works?: WorkItem[]
    preview?: boolean
}) {
    const home = useHome({ preview })
    const [activeLabel, setActiveLabel] = useState('all')

    const sourceWorks = useMemo(
        () =>
            works?.length
                ? works
                : [
                      ...home.weeklyChart,
                      ...home.freshReleases,
                      ...home.popularWorks,
                      ...home.topLikedWorks,
                      ...home.todayReleases,
                  ],
        [
            works,
            home.weeklyChart,
            home.freshReleases,
            home.popularWorks,
            home.topLikedWorks,
            home.todayReleases,
        ]
    )

    const items = useMemo(
        () =>
            sortItems(uniqueItems(filterItems(sourceWorks, widget)), widget).slice(
                0,
                widget.settings.limit ?? 12
            ),
        [sourceWorks, widget]
    )

    const labels = useMemo(() => labelOptions(items), [items])

    const visibleItems = useMemo(
        () =>
            activeLabel === 'all'
                ? items
                : items.filter((item) =>
                      (item.genres ?? []).some(
                          (label) => label.toLowerCase() === activeLabel.toLowerCase()
                      )
                  ),
        [activeLabel, items]
    )

    if (items.length === 0) return null

    return (
        <section className="w-full overflow-hidden bg-gradient-to-br from-sky-50 via-background to-amber-50 px-3 py-2 sm:px-4 dark:from-sky-950/20 dark:via-background dark:to-amber-950/20">
            <section className="mx-auto mt-8 mb-8 w-full max-w-[1360px]">
                <div className="overflow-hidden rounded-[20px] border border-[var(--comix-filter-border)] bg-[var(--comix-filter-background)] shadow-[var(--shadow-xs)]">
                    <div className="flex min-h-14 items-center gap-1 overflow-x-auto px-4 py-3 sm:gap-2">
                        <TabButton
                            active={activeLabel === 'all'}
                            onClick={() => setActiveLabel('all')}
                        >
                            All
                        </TabButton>

                        {labels.map((label) => (
                            <TabButton
                                key={label}
                                active={activeLabel === label}
                                onClick={() => setActiveLabel(label)}
                            >
                                {label}
                            </TabButton>
                        ))}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 justify-items-start gap-6 min-[560px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {visibleItems.map((item, index) => (
                        <TabWorkCard
                            key={`${item.type}-${item.slug || item.id}`}
                            item={item}
                            rank={index + 1}
                            widget={widget}
                        />
                    ))}
                </div>
            </section>
        </section>
    )
}

function TabWorkCard({
    item,
    rank,
    widget,
}: {
    item: TabCardItem
    rank: number
    widget: PageWidget
}) {
    const settings = widget.settings ?? {}
    const image = imageFor(item)
    const typeLabel = getTypeLabel(item.type)
    const primaryGenre = item.genres?.[0]
    const statusLabel = getStatusLabel(item)
    const newItem = isNewItem(item.created_at)

    const showTitle = settings.card_show_name !== false
    const showViews = settings.card_show_views !== false
    const showLikes = settings.card_show_likes !== false
    const showStatus = settings.card_show_status !== false
    const showGenres = settings.card_show_genres !== false
    const showType = settings.card_show_type !== false
    const showRank = settings.card_show_rank !== false
    const showStats = showViews || showLikes

    return (
        <Link
            to={hrefFor(item)}
            className="group block h-full w-full max-w-[320px]"
            aria-label={`Open ${item.title}`}
        >
            <article className="flex h-full min-h-[560px] w-full flex-col overflow-hidden rounded-[32px] border border-black/5 bg-white p-2 text-black shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(0,0,0,0.18)]">
                <div className="relative h-[370px] w-full overflow-hidden rounded-[24px] bg-muted">
                    {image ? (
                        <img
                            src={image}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="grid h-full w-full place-items-center px-4 text-center text-sm text-muted-foreground">
                            No cover image
                        </div>
                    )}

                    <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            {showStatus && statusLabel && (
                                <span className="inline-flex h-8 items-center justify-center rounded-full bg-white px-4 text-[12px] font-semibold text-orange-500 shadow-sm">
                                    {statusLabel}
                                </span>
                            )}

                            {newItem && (
                                <span className="inline-flex h-8 items-center justify-center rounded-full bg-[#ff547c] px-5 text-sm font-semibold text-white shadow-sm">
                                    New
                                </span>
                            )}
                        </div>

                        {showRank && (
                            <span
                                className="
                                    inline-flex
                                    h-12
                                    w-10
                                    shrink-0
                                    items-start
                                    justify-center
                                    bg-red-600
                                    pt-2
                                    text-sm
                                    font-bold
                                    text-white
                                    shadow-md
                                    [clip-path:polygon(0_0,100%_0,100%_100%,50%_76%,0_100%)]
                                "
                            >
                                {rank}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-1 flex-col pt-4">
                    {showTitle && (
                        <h3 className="min-h-[84px] line-clamp-2 text-[22px] font-bold leading-[1.2]">
                            {item.title}
                        </h3>
                    )}

                    {showStats && (
                        <div className="mt-3 flex min-h-[28px] flex-wrap items-center gap-x-8 gap-y-2 text-[14px] font-medium">
                            {showViews && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Eye
                                        className="h-5 w-5 shrink-0 text-[#ff547c]"
                                        strokeWidth={2.4}
                                    />
                                    <span>{formatCount(item.views ?? 0)}</span>
                                </span>
                            )}

                            {showLikes && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Heart
                                        className="h-5 w-5 shrink-0 fill-red-500 text-red-500"
                                        strokeWidth={2.4}
                                    />
                                    <span>{formatCount(item.likes ?? 0)}</span>
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mt-auto flex flex-wrap gap-3 pt-5">
                        {showType && (
                            <span className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center rounded-full bg-[#ff547c] px-5 py-2 text-center text-[15px] font-medium text-white">
                                <span className="truncate">{typeLabel}</span>
                            </span>
                        )}

                        {showGenres && primaryGenre && (
                            <span className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center rounded-full bg-[#5da8ea] px-5 py-2 text-center text-[15px] font-medium text-white">
                                <span className="truncate">{primaryGenre}</span>
                            </span>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    )
}

function TabButton({
    active,
    children,
    onClick,
}: {
    active: boolean
    children: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3.5 text-sm no-underline whitespace-nowrap transition-all duration-200 ${
                active
                    ? 'bg-white/80 font-bold text-[var(--foreground)] shadow-sm'
                    : 'font-medium text-[var(--foreground)] hover:bg-white/50'
            }`}
        >
            {children}
        </button>
    )
}

function filterItems(works: WorkItem[], widget: PageWidget): TabCardItem[] {
    const source = widget.settings.filter_cards_data ?? 'mixed'

    return works
        .filter((work) => work.type !== 'commission')
        .filter((work) => matchesDateWindow(work.created_at, widget))
        .filter((work) => {
            if (source === 'mixed') return true
            if (source === 'comix') return work.type === 'webtoon'
            if (source === 'novels') return work.type === 'wattpad'
            if (source === 'arts') return work.type === 'art'
            return true
        }) as TabCardItem[]
}

function uniqueItems(items: TabCardItem[]) {
    const seen = new Set<string>()

    return items.filter((item) => {
        const key = `${item.type}-${item.slug || item.id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

function sortItems(items: TabCardItem[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...items].sort((a, b) => {
        for (const sort of sorts) {
            const result = compareBySort(a, b, sort)
            if (result !== 0) return result
        }

        return 0
    })
}

function compareBySort(a: TabCardItem, b: TabCardItem, sort: string) {
    if (sort === 'featured') return Number(b.is_featured) - Number(a.is_featured)
    if (sort === 'likes') return (b.likes ?? 0) - (a.likes ?? 0)
    if (sort === 'views' || sort === 'popular') return (b.views ?? 0) - (a.views ?? 0)
    if (sort === 'new' || sort === 'latest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    }
    return 0
}

function labelOptions(items: TabCardItem[]) {
    const counts = new Map<string, number>()
    items.forEach((item) => {
        ;(item.genres ?? []).forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1))
    })

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 16)
        .map(([label]) => label)
}

function imageFor(item: TabCardItem) {
    return item.cover ? storageUrl(item.cover, item.type === 'art' ? undefined : 'sm') : null
}

function hrefFor(item: TabCardItem) {
    return item.type === 'art'
        ? `/explore/arts?art=${encodeURIComponent(item.slug || item.id)}`
        : `/works/${item.slug}`
}

function getTypeLabel(type: TabCardItem['type']) {
    if (type === 'art') return 'Art'
    if (type === 'wattpad') return 'Novel'
    return 'Webtoon'
}

function getStatusLabel(item: TabCardItem) {
    if (item.boosted_until || item.is_featured) return 'Event'
    if (!item.status) return null

    const value = item.status.trim()
    if (!value) return null

    return value.charAt(0).toUpperCase() + value.slice(1)
}

function isNewItem(createdAt?: string) {
    if (!createdAt) return false

    const createdDate = new Date(createdAt)
    if (Number.isNaN(createdDate.getTime())) return false

    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    const difference = Date.now() - createdDate.getTime()

    return difference >= 0 && difference <= thirtyDays
}

function formatCount(value: number) {
    return new Intl.NumberFormat('en', {
        notation: value >= 1000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
    }).format(value)
}

function matchesDateWindow(value: string | undefined, widget: PageWidget) {
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
