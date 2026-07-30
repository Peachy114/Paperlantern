import { useMemo, useState } from 'react'
import { Eye, Heart, Sparkles } from 'lucide-react'
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

    if (items.length === 0) {
        return null
    }

    return (
        <section className="w-full overflow-hidden bg-gradient-to-br from-sky-50 via-background to-amber-50 px-3 py-2 sm:px-4 dark:from-sky-950/20 dark:via-background dark:to-amber-950/20">
            <section className="mx-auto my-8 w-full max-w-[1480px]">
                {/* Filter tabs */}
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

                {/* Cards */}
                <div className="mt-5 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
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
    const secondaryGenre = item.genres?.[1]

    const eventLabel = getEventLabel(item)
    const statusLabel = getStatusLabel(item)
    const newItem = isNewItem(item.created_at)
    const boosted = Boolean(item.boosted_until)

    const showTitle = settings.card_show_name !== false
    const showViews = settings.card_show_views !== false
    const showLikes = settings.card_show_likes !== false
    const showStatus = settings.card_show_status !== false
    const showGenres = settings.card_show_genres !== false
    const showType = settings.card_show_type !== false
    const showRank = settings.card_show_rank !== false

    const showStats = showViews || showLikes

    const showLabels = showType || (showGenres && Boolean(primaryGenre || secondaryGenre))

    return (
        <Link
            to={hrefFor(item)}
            className="group block h-full min-w-0 no-underline"
            aria-label={`Open ${item.title}`}
        >
            <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] text-card-foreground transition-all duration-300 group-hover:-translate-y-1 ">
                {/* Cover */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[15px] bg-muted">
                    {image ? (
                        <img
                            src={image}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted px-4 text-center text-xs text-muted-foreground">
                            No Cover
                        </div>
                    )}

                    {/* Top-left labels */}
                    <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap items-center gap-1.5">
                        {showStatus && eventLabel && (
                            <span className="inline-flex h-5 max-w-24 items-center justify-center truncate rounded-full bg-white px-2.5 text-[9px] font-semibold text-amber-500 shadow-sm">
                                {eventLabel}
                            </span>
                        )}

                        {newItem && (
                            <span className="inline-flex h-5 items-center justify-center rounded-full bg-[var(--comix-badge-new)] px-3 text-[9px] font-semibold text-white shadow-sm">
                                New
                            </span>
                        )}
                    </div>

                    {/* Rank ribbon */}
                    {showRank && (
                        <div
                            className="absolute right-2 top-0 z-20 flex h-10 w-7 items-start justify-center bg-red-500 pt-1.5 text-[11px] font-bold text-white shadow-sm"
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)',
                            }}
                        >
                            {rank}
                        </div>
                    )}

                    {/* Status */}
                    {showStatus && statusLabel && (
                        <span className="absolute bottom-2 left-2 z-10 inline-flex max-w-[45%] items-center truncate rounded-full bg-[var(--comix-accent)] px-2.5 py-1 text-[9px] font-semibold capitalize text-white shadow-sm">
                            {statusLabel}
                        </span>
                    )}

                    {/* Boosted */}
                    {boosted && (
                        <span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-bold text-black shadow-sm">
                            <Sparkles className="size-3" />
                            Boosted
                        </span>
                    )}
                </div>

                {/* Information area */}
                <div className="flex min-w-0 flex-1 flex-col px-1 pb-1 pt-2">
                    {/* Title */}
                    {showTitle && (
                        <h3
                            title={item.title}
                            className="h-10 overflow-hidden text-ellipsis text-[13px] font-extrabold leading-5 text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                        >
                            {item.title}
                        </h3>
                    )}

                    {/* Statistics */}
                    {showStats && (
                        <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-3 text-[10px] font-medium text-muted-foreground">
                            {showViews && (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                    <Eye className="size-3.5 shrink-0 text-rose-500" />

                                    <span>{formatCount(item.views ?? 0)}</span>
                                </span>
                            )}

                            {showLikes && (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                    <Heart className="size-3.5 shrink-0 fill-red-500 text-red-500" />

                                    <span>{formatCount(item.likes ?? 0)}</span>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Type and genre labels */}
                    {showLabels && (
                        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2">
                            {showType && (
                                <span className="inline-flex min-w-0 items-center justify-center truncate rounded-full bg-rose-500 px-2 py-1.5 text-[9px] font-medium text-white">
                                    {typeLabel}
                                </span>
                            )}

                            {showGenres && primaryGenre && (
                                <span className="inline-flex min-w-0 items-center justify-center truncate rounded-full bg-[var(--comix-blue)] px-2 py-1.5 text-[9px] font-medium text-white">
                                    {primaryGenre}
                                </span>
                            )}

                            {showGenres && secondaryGenre && (
                                <span className="inline-flex min-w-0 items-center justify-center truncate rounded-full bg-[var(--no-color)] px-2 py-1.5 text-[9px] font-medium text-white">
                                    {secondaryGenre}
                                </span>
                            )}
                        </div>
                    )}
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
            className={`inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-sm no-underline transition-all duration-200 ${
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

function uniqueItems(items: TabCardItem[]) {
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

function sortItems(items: TabCardItem[], widget: PageWidget) {
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

function compareBySort(a: TabCardItem, b: TabCardItem, sort: string) {
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

function labelOptions(items: TabCardItem[]) {
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

function imageFor(item: TabCardItem) {
    return item.cover ? storageUrl(item.cover, item.type === 'art' ? undefined : 'sm') : null
}

function hrefFor(item: TabCardItem) {
    return item.type === 'art'
        ? `/explore/arts?art=${encodeURIComponent(item.slug || item.id)}`
        : `/works/${item.slug || item.id}`
}

function getTypeLabel(type: TabCardItem['type']) {
    if (type === 'art') {
        return 'Art'
    }

    if (type === 'wattpad') {
        return 'Novel'
    }

    return 'Webtoon'
}

function getEventLabel(item: TabCardItem) {
    if (item.boosted_until) {
        return 'Event'
    }

    if (item.is_featured) {
        return 'Featured'
    }

    return null
}

function getStatusLabel(item: TabCardItem) {
    if (!item.status) {
        return null
    }

    const value = item.status.trim()

    if (!value) {
        return null
    }

    return value.charAt(0).toUpperCase() + value.slice(1)
}

function isNewItem(createdAt?: string) {
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

function formatCount(value: number) {
    return new Intl.NumberFormat('en', {
        notation: value >= 1000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
    }).format(value)
}

function matchesDateWindow(value: string | undefined, widget: PageWidget) {
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
