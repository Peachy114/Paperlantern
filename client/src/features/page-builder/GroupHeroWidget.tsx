import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Eye, Heart, ImageOff, Star } from 'lucide-react'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import type { PageWidget } from '@/types/pageLayout'
import type { WorkItem } from '@/features/work/hooks/useHome'
import type { Art } from '@/types/art'
import type { CommissionService } from '@/types/commission'

type GroupHeroDesign = 'default' | 'popular_arts' | 'spotlight_stack'
type GroupSource = 'arts' | 'comix' | 'novels' | 'commission'
type GroupSort = 'popular' | 'latest' | 'likes' | 'views' | 'featured'

type GroupHeroItem = {
    id: string
    type: GroupSource
    title: string
    artist?: string | null
    image: string | null
    href: string
    likes: number
    views: number
    createdAt: string
    featured: boolean
    labels: string[]
}

export default function GroupHeroWidget({
    widget,
    works = [],
}: {
    widget: PageWidget
    works?: WorkItem[]
}) {
    const settings = widget.settings ?? {}
    const design = (settings.group_hero_design ?? 'popular_arts') as GroupHeroDesign
    const sort = (settings.group_sort ?? 'popular') as GroupSort
    const requestedLimit =
        design === 'popular_arts'
            ? clampPopularArtsLimit(Number(settings.limit ?? 9))
            : Math.max(1, Number(settings.limit ?? 10))
    const sources = selectedSources(widget)
    const filters = parseFilters(settings.group_filter_labels)

    const artParams = useMemo(() => {
        const next = new URLSearchParams()
        if (sort) next.set('sort', sort)
        return next
    }, [sort])

    const commissionParams = useMemo(() => {
        const next = new URLSearchParams()
        if (sort) next.set('sort', sort)
        return next
    }, [sort])

    const artsQuery = useQuery({
        queryKey: ['group-hero-arts', artParams.toString()],
        enabled: sources.includes('arts'),
        queryFn: () => publicApi.getArts(artParams).then((res) => res.data),
        staleTime: 60_000,
    })

    const commissionsQuery = useQuery({
        queryKey: ['group-hero-commissions', commissionParams.toString()],
        enabled: sources.includes('commission'),
        queryFn: () => publicApi.getCommissions(commissionParams).then((res) => res.data),
        staleTime: 60_000,
    })

    const items = useMemo<GroupHeroItem[]>(() => {
        const nextItems: GroupHeroItem[] = []

        if (sources.includes('comix') || sources.includes('novels')) {
            works.forEach((work) => {
                const isNovel = work.type === 'wattpad'
                if (sources.includes('comix') && work.type !== 'webtoon') return
                if (sources.includes('novels') && !isNovel) return

                nextItems.push({
                    id: `work-${work.id}`,
                    type: isNovel ? 'novels' : 'comix',
                    title: work.title,
                    image: storageUrl(work.banner || work.cover),
                    href: `/works/${work.slug}`,
                    likes: work.likes ?? 0,
                    views: work.views ?? 0,
                    createdAt: work.created_at ?? '',
                    featured: Boolean(work.is_featured),
                    labels: work.genres ?? [],
                })
            })
        }

        if (sources.includes('arts')) {
            const arts = (artsQuery.data?.arts?.data ?? []) as Art[]

            arts.forEach((art) => {
                nextItems.push({
                    id: `art-${art.id}`,
                    type: 'arts',
                    title: art.title,
                    artist: art.user?.name ?? art.user?.username,
                    image: storageUrl(art.images?.[0]?.image_path ?? art.image_path),
                    href: `/explore/arts?art=${encodeURIComponent(art.slug || art.id)}`,
                    likes: art.likes ?? 0,
                    views: art.views ?? 0,
                    createdAt: art.created_at ?? '',
                    featured: Boolean(art.is_featured || art.boosted_until),
                    labels: art.labels ?? [],
                })
            })
        }

        if (sources.includes('commission')) {
            const commissions = (commissionsQuery.data?.commissions?.data ??
                []) as CommissionService[]

            commissions.forEach((commission) => {
                nextItems.push({
                    id: `commission-${commission.id}`,
                    type: 'commission',
                    title: commission.title,
                    artist: commission.artist?.name ?? commission.artist?.username,
                    image: storageUrl(commission.image_path ?? commission.artist?.avatar ?? null),
                    href: `/commissions?service=${encodeURIComponent(commission.slug)}`,
                    likes: commission.ratings_count ?? 0,
                    views: commission.customers_count ?? 0,
                    createdAt: '',
                    featured: Boolean(commission.is_featured || commission.boosted_until),
                    labels: commission.category?.name ? [commission.category.name] : ['Commission'],
                })
            })
        }

        return sortItems(
            nextItems
                .filter((item) => Boolean(item.image))
                .filter((item) =>
                    filters.length === 0
                        ? true
                        : filters.some((filter) =>
                              item.labels.some((label) => label.toLowerCase().includes(filter))
                          )
                ),
            sort
        ).slice(0, requestedLimit)
    }, [artsQuery.data, commissionsQuery.data, filters, requestedLimit, sort, sources, works])

    const isLoading =
        (sources.includes('arts') && artsQuery.isLoading) ||
        (sources.includes('commission') && commissionsQuery.isLoading)

    if (isLoading && items.length === 0) {
        return design === 'popular_arts' ? <MosaicSkeleton /> : <CardGridSkeleton />
    }

    if (items.length === 0) return null

    if (design === 'popular_arts') {
        return <PopularArtsMosaic widget={widget} items={items} viewAllHref={viewAllHref(widget)} />
    }

    if (design === 'spotlight_stack') {
        return <SpotlightStack widget={widget} items={items} viewAllHref={viewAllHref(widget)} />
    }

    return <DefaultCardGrid widget={widget} items={items} viewAllHref={viewAllHref(widget)} />
}

function DefaultCardGrid({
    widget,
    items,
    viewAllHref,
}: {
    widget: PageWidget
    items: GroupHeroItem[]
    viewAllHref: string | null
}) {
    return (
        <section className="w-full bg-background px-4 py-12 sm:py-16">
            <div className="mx-auto w-full max-w-[1360px]">
                <SectionHeader title={widget.title || 'Fresh Release'} viewAllHref={viewAllHref} />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
                    {items.map((item, index) => (
                        <DefaultItemCard key={item.id} item={item} rank={index + 1} />
                    ))}
                </div>
            </div>
        </section>
    )
}

function PopularArtsMosaic({
    widget,
    items,
    viewAllHref,
}: {
    widget: PageWidget
    items: GroupHeroItem[]
    viewAllHref: string | null
}) {
    const [featured, ...smallItems] = items
    const text = widget.settings?.text?.trim() || 'Artwork for this week'

    return (
        <section className="w-full overflow-hidden bg-gradient-to-br from-sky-50 via-background to-amber-50 px-3 py-12 sm:px-4 sm:py-16 dark:from-sky-950/20 dark:via-background dark:to-amber-950/20">
            <div className="mx-auto w-full max-w-[1180px]">
                <SectionHeader
                    title={widget.title || 'Popular Arts'}
                    centered
                    viewAllHref={viewAllHref}
                />

                {/* ====================================================== */}
                {/* // popular arts responsive layout ---- */}
                {/* ====================================================== */}

                <div className="grid min-w-0 gap-3 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
                    {/* //// featured artwork ---- */}
                    <GroupItemCard
                        item={featured}
                        rank={1}
                        large
                        className="min-h-[340px] sm:min-h-[460px] lg:min-h-[560px]"
                    />

                    {/* //// automatically adapting artwork grid ---- */}
                    <div className="grid min-w-0 auto-rows-[145px] grid-cols-2 gap-3 sm:auto-rows-[165px] lg:auto-rows-[170px] lg:grid-cols-6">
                        {smallItems[0] && (
                            <GroupItemCard
                                item={smallItems[0]}
                                rank={2}
                                className={getPopularArtCardClass(0, smallItems.length)}
                            />
                        )}

                        {/* //// artwork message tile ---- */}
                        <div className="col-span-2 flex min-h-0 items-center justify-center overflow-hidden rounded-2xl bg-background px-3 py-3 text-center text-[10px] font-black uppercase tracking-wide text-orange-500 shadow-md sm:px-4 sm:text-sm lg:col-span-4">
                            <span className="line-clamp-3">{text}</span>
                        </div>

                        {smallItems.slice(1).map((item, index) => {
                            const actualIndex = index + 1

                            return (
                                <GroupItemCard
                                    key={item.id}
                                    item={item}
                                    rank={actualIndex + 2}
                                    className={getPopularArtCardClass(
                                        actualIndex,
                                        smallItems.length
                                    )}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}

function SpotlightStack({
    widget,
    items,
    viewAllHref,
}: {
    widget: PageWidget
    items: GroupHeroItem[]
    viewAllHref: string | null
}) {
    const [featured, ...rest] = items

    return (
        <section className="w-full bg-background px-4 py-12 sm:py-16">
            <div className="mx-auto w-full max-w-[1180px]">
                <SectionHeader title={widget.title || 'Spotlight'} viewAllHref={viewAllHref} />

                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <GroupItemCard item={featured} rank={1} large className="min-h-[420px]" />
                    <div className="grid grid-cols-2 gap-3">
                        {rest.slice(0, 6).map((item, index) => (
                            <GroupItemCard key={item.id} item={item} rank={index + 2} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

function DefaultItemCard({ item, rank }: { item: GroupHeroItem; rank: number }) {
    const firstLabel = item.labels[0] ?? labelForType(item.type)
    const secondLabel = item.labels[1]

    return (
        <Link
            to={item.href}
            className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-background p-1.5 shadow-sm outline-none ring-offset-background transition hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                <ItemImage item={item} />
                <span className="absolute right-2 top-0 flex min-h-8 min-w-7 items-center justify-center rounded-b-md bg-red-500 px-1 text-[10px] font-black text-white shadow">
                    {rank}
                </span>
            </div>

            <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-2">
                <h3 className="line-clamp-2 text-xs font-black leading-snug sm:text-sm">
                    {item.title}
                </h3>
                {item.artist && (
                    <p className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">
                        by {item.artist}
                    </p>
                )}
                <Stats item={item} />
                <div className="mt-auto flex flex-wrap gap-1 pt-2">
                    <span className="rounded-full bg-pink-500 px-2 py-1 text-[9px] font-semibold text-white">
                        {firstLabel}
                    </span>
                    {secondLabel && (
                        <span className="rounded-full bg-sky-400 px-2 py-1 text-[9px] font-semibold text-white">
                            {secondLabel}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}

function GroupItemCard({
    item,
    rank,
    large = false,
    className = '',
}: {
    item: GroupHeroItem
    rank: number
    large?: boolean
    className?: string
}) {
    return (
        <Link
            to={item.href}
            className={`group relative block h-full min-h-0 min-w-0 overflow-hidden rounded-xl bg-muted shadow-sm outline-none ring-offset-background transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
        >
            <ItemImage item={item} />
            <span className="absolute left-0 top-0 flex h-10 w-8 items-center justify-center bg-red-500 text-xs font-black text-white shadow">
                {rank}
            </span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 text-white">
                <h3
                    className={`line-clamp-2 font-black leading-tight ${
                        large ? 'text-xl sm:text-2xl' : 'text-sm'
                    }`}
                >
                    {item.title}
                </h3>
                <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black/75 px-1.5 text-[10px] font-black uppercase">
                        {labelForType(item.type)[0]}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                        <Heart className="h-3 w-3 fill-current" />
                        {formatCount(item.likes)}
                    </span>
                </div>
            </div>
        </Link>
    )
}

function ItemImage({ item }: { item: GroupHeroItem }) {
    return item.image ? (
        <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full select-none object-cover transition duration-300 group-hover:scale-[1.03]"
        />
    ) : (
        <EmptyImage />
    )
}

function SectionHeader({
    title,
    centered = false,
    viewAllHref,
}: {
    title: string
    centered?: boolean
    viewAllHref: string | null
}) {
    return (
        <div
            className={`mb-8 flex items-end gap-4 ${
                centered ? 'justify-center sm:relative' : 'justify-between'
            }`}
        >
            <h2
                className={`text-2xl font-black tracking-tight sm:text-3xl ${
                    centered ? 'text-center' : ''
                }`}
            >
                {title}
            </h2>
            {viewAllHref && (
                <Link
                    to={viewAllHref}
                    className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-foreground/80 hover:text-foreground ${
                        centered ? 'sm:absolute sm:right-0' : ''
                    }`}
                >
                    View all
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
            )}
        </div>
    )
}

function Stats({ item }: { item: GroupHeroItem }) {
    return (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3 text-pink-500" />
                {formatCount(item.views)}
            </span>
            <span className="inline-flex items-center gap-1">
                {item.type === 'commission' ? (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                ) : (
                    <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                )}
                {formatCount(item.likes)}
            </span>
        </div>
    )
}

function EmptyImage() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-6 w-6 text-muted-foreground" />
        </div>
    )
}

/*
 * Popular Arts accepts a database/widget limit from 7 through 12.
 * Set settings.limit to 7, 8, 9, 10, 11, or 12.
 */
function clampPopularArtsLimit(value: number) {
    if (!Number.isFinite(value)) return 9
    return Math.min(12, Math.max(7, Math.floor(value)))
}

function getPopularArtCardClass(index: number, total: number) {
    const isLast = index === total - 1
    const isSecondLast = index === total - 2

    /*
     * Mobile uses two columns:
     * - An odd final item spans both columns.
     *
     * Desktop uses a six-column grid:
     * - Normal cards span two columns, giving three cards per row.
     * - One leftover card spans all six columns.
     * - Two leftover cards each span three columns.
     */
    /*
     * The message tile also occupies one mobile grid cell.
     * Therefore, the last artwork only spans both columns when:
     *
     * message tile + artwork cards = an odd number of cells.
     *
     * smallItems:
     * 7  -> 8 cells with message  -> balanced
     * 8  -> 9 cells with message  -> last artwork spans 2
     * 9  -> 10 cells with message -> balanced
     * 10 -> 11 cells with message -> last artwork spans 2
     * 11 -> 12 cells with message -> balanced
     */
    /*
     * On small screens, the message tile spans both columns.
     * Only the artwork cards determine whether the last row is incomplete.
     *
     * total = number of small artwork cards after the featured artwork.
     * When total is odd, the final artwork spans both columns.
     *
     * Examples:
     * 7 total records  -> 6 small cards -> balanced
     * 8 total records  -> 7 small cards -> last card spans full width
     * 9 total records  -> 8 small cards -> balanced
     * 10 total records -> 9 small cards -> last card spans full width
     */
    const mobileClass = total % 2 === 1 && isLast ? 'col-span-2' : ''

    const desktopRemainder = (total + 2) % 3

    if (desktopRemainder === 1 && isLast) {
        return `${mobileClass} lg:col-span-6`
    }

    if (desktopRemainder === 2 && (isSecondLast || isLast)) {
        return `${mobileClass} lg:col-span-3`
    }

    return `${mobileClass} lg:col-span-2`
}

function selectedSources(widget: PageWidget): GroupSource[] {
    const settings = widget.settings ?? {}
    const sources: GroupSource[] = []
    if (settings.group_source_arts ?? true) sources.push('arts')
    if (settings.group_source_comix ?? false) sources.push('comix')
    if (settings.group_source_novels ?? false) sources.push('novels')
    if (settings.group_source_commissions ?? false) sources.push('commission')
    return sources.length ? sources : ['arts']
}

function parseFilters(value?: string) {
    return (value ?? '')
        .split(',')
        .map((filter) => filter.trim().toLowerCase())
        .filter(Boolean)
}

function sortItems(items: GroupHeroItem[], sort: GroupSort) {
    const sorted = [...items]
    if (sort === 'latest') {
        return sorted.sort(
            (a, b) => Date.parse(b.createdAt || '0') - Date.parse(a.createdAt || '0')
        )
    }
    if (sort === 'likes') return sorted.sort((a, b) => b.likes - a.likes)
    if (sort === 'views' || sort === 'popular') return sorted.sort((a, b) => b.views - a.views)
    if (sort === 'featured') {
        return sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.views - a.views)
    }
    return sorted
}

function viewAllHref(widget: PageWidget) {
    const settings = widget.settings ?? {}
    if (settings.group_view_all_enabled === false) return null

    const sort = (settings.group_view_all_sort ?? settings.group_sort ?? 'popular') as GroupSort
    const filter = parseFilters(settings.group_filter_labels)[0]
    const source = selectedSources(widget)[0]

    if (source === 'arts') {
        const params = new URLSearchParams()
        if (sort) params.set('sort', sort)
        if (filter) params.set('label', filter)
        return `/explore/arts${params.toString() ? `?${params.toString()}` : ''}`
    }

    if (source === 'commission') {
        const params = new URLSearchParams()
        if (sort) params.set('sort', sort)
        if (filter) params.set('category', filter)
        return `/commissions${params.toString() ? `?${params.toString()}` : ''}`
    }

    const params = new URLSearchParams()
    params.set('type', source === 'novels' ? 'novel' : 'comic')
    if (['popular', 'likes', 'views', 'featured'].includes(sort)) params.set('view', 'rankings')
    if (filter) params.set('genre', filter)
    return `/comix?${params.toString()}`
}

function labelForType(type: GroupSource) {
    if (type === 'comix') return 'Webtoon'
    if (type === 'novels') return 'Novel'
    if (type === 'commission') return 'Commission'
    return 'Art'
}

function formatCount(value: number) {
    return new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value)
}

function CardGridSkeleton() {
    return (
        <section className="w-full bg-background px-4 py-14">
            <div className="mx-auto max-w-[1360px]">
                <div className="mx-auto mb-8 h-7 w-48 animate-pulse rounded bg-muted" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div
                            key={index}
                            className="aspect-[3/5] animate-pulse rounded-2xl bg-muted"
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

function MosaicSkeleton() {
    return (
        <section className="w-full overflow-hidden bg-gradient-to-br from-sky-50 via-background to-amber-50 px-3 py-14 sm:px-4 dark:from-sky-950/20 dark:via-background dark:to-amber-950/20">
            <div className="mx-auto max-w-[1180px]">
                <div className="mx-auto mb-8 h-7 w-48 animate-pulse rounded bg-muted" />

                <div className="grid min-w-0 gap-3 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
                    <div className="min-h-[340px] animate-pulse rounded-xl bg-muted sm:min-h-[460px] lg:min-h-[560px]" />

                    <div className="grid min-w-0 auto-rows-[145px] grid-cols-2 gap-3 sm:auto-rows-[165px] lg:auto-rows-[170px] lg:grid-cols-6">
                        <div className="min-h-0 animate-pulse rounded-xl bg-muted lg:col-span-2" />
                        <div className="col-span-2 min-h-0 animate-pulse rounded-2xl bg-muted lg:col-span-4" />

                        {Array.from({ length: 7 }).map((_, index) => (
                            <div
                                key={index}
                                className="min-h-0 animate-pulse rounded-xl bg-muted lg:col-span-2"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
