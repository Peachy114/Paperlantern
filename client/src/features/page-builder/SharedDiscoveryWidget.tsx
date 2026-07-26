import { Link } from 'react-router-dom'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import LabelRailWidget from '@/features/page-builder/LabelRailWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import TabCardsWidget from '@/features/page-builder/TabCardsWidget'
import EpisodesWidget from '@/features/page-builder/EpisodesWidget'
import LatestChaptersSection from '@/features/work/components/LatestChaptersSection'
import FreshReleasesSection from '@/features/work/components/FreshReleasesSection'
import WeeklyChartSection from '@/features/work/components/WeeklyChartSection'
import { useHome, type WorkItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'
import { gridContinuationOffset, labelContinuationOffset } from './continuation'

const SHARED_TYPES = new Set([
    'content_tabs',
    'tab_cards',
    'episodes',
    'labels',
    'weekly',
    'daily',
    'today_releases',
    'today_top',
    'fresh',
    'latest',
    'popular',
    'top_liker',
    'grid_image',
    'grid_con',
    'cards',
    'top_10s',
    'shop_card',
])

export function isSharedDiscoveryWidget(type: string) {
    return SHARED_TYPES.has(type)
}

export default function SharedDiscoveryWidget({
    widget,
    widgets = [widget],
}: {
    widget: PageWidget
    widgets?: PageWidget[]
}) {
    const home = useHome()
    const limit = widget.settings.limit ?? 10
    const gridOffset = gridContinuationOffset(widgets, widget)
    const allWorks = [
        ...home.hero,
        ...home.weeklyChart,
        ...home.todayReleases,
        ...home.todayTopViews,
        ...home.freshReleases,
        ...home.dailyWorks,
        ...home.popularWorks,
        ...home.topLikedWorks,
    ]
    const filteredWorks = (works: WorkItem[]) => applyFilters(byDataSource(works, widget), widget)

    if (widget.type === 'content_tabs') return <ContentTabsWidget widget={widget} />
    if (widget.type === 'tab_cards') return <TabCardsWidget widget={widget} works={allWorks} />
    if (widget.type === 'episodes') {
        return <EpisodesWidget widget={widget} chapters={home.latestChapters} cover={home.cover} />
    }
    if (widget.type === 'shop_card') return <ShopCardWidget widget={widget} />
    if (widget.type === 'labels') {
        if (widget.settings.labels_display === 'menu_label') {
            return (
                <LabelRailWidget
                    widget={widget}
                    labels={[
                        { label: 'Main' },
                        { label: 'Comix' },
                        { label: 'Novel' },
                        { label: 'Arts' },
                    ]}
                    offset={0}
                />
            )
        }
        if (widget.settings.labels_display === 'labels_cards') {
            return (
                <div>
                    <LabelRailWidget
                        widget={widget}
                        labels={labelItemsFromWorks(sourceFilteredLabelWorks(allWorks, widget))}
                        offset={labelContinuationOffset(widgets ?? [], widget)}
                    />
                    <TabCardsWidget widget={widget} works={allWorks} />
                </div>
            )
        }

        return (
            <LabelRailWidget
                widget={widget}
                labels={labelItemsFromWorks(sourceFilteredLabelWorks(allWorks, widget))}
                offset={labelContinuationOffset(widgets, widget)}
            />
        )
    }
    if (widget.type === 'weekly') {
        return (
            <WeeklyChartSection
                weeklyChart={filteredWorks(home.weeklyChart).slice(gridOffset, gridOffset + limit)}
                cover={home.cover}
            />
        )
    }
    if (widget.type === 'fresh') {
        return (
            <FreshReleasesSection
                freshReleases={filteredWorks(home.freshReleases).slice(gridOffset, gridOffset + limit)}
                cover={home.cover}
            />
        )
    }
    if (widget.type === 'latest') {
        return (
            <LatestChaptersSection
                latestChapters={home.latestChapters.slice(0, limit)}
                cover={home.cover}
            />
        )
    }
    if (widget.type === 'daily' || widget.type === 'today_releases') {
        const source = home.todayReleases.length ? home.todayReleases : home.dailyWorks
        return (
            <SharedWorkGrid
                title={widget.title || "Today's Releases"}
                works={filteredWorks(source).slice(gridOffset, gridOffset + limit)}
                cover={home.cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    }
    if (widget.type === 'today_top' || widget.type === 'top_10s') {
        const source =
            widget.settings.metric === 'likes'
                ? home.todayTopLikes.length
                    ? home.todayTopLikes
                    : home.topLikedWorks
                : home.todayTopViews.length
                  ? home.todayTopViews
                  : home.popularWorks

        return (
            <SharedWorkGrid
                title={widget.title || "Today's Top 10"}
                works={filteredWorks(source).slice(gridOffset, gridOffset + limit)}
                cover={home.cover}
                metric={widget.settings.metric ?? 'views'}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    }
    if (widget.type === 'top_liker') {
        return (
            <SharedWorkGrid
                title={widget.title || 'Top Liker'}
                works={filteredWorks(home.topLikedWorks.length ? home.topLikedWorks : home.popularWorks).slice(
                    gridOffset,
                    gridOffset + limit
                )}
                cover={home.cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    }
    if (['popular', 'grid_image', 'grid_con', 'cards'].includes(widget.type)) {
        return (
            <SharedWorkGrid
                title={widget.title || 'Popular'}
                works={filteredWorks(home.popularWorks).slice(gridOffset, gridOffset + limit)}
                cover={home.cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    }

    return null
}

function sourceFilteredLabelWorks(works: WorkItem[], widget: PageWidget) {
    const source = widget.settings.filter_cards_data ?? 'mixed'

    return works.filter((work) => {
        if (source === 'comix') return work.type === 'webtoon'
        if (source === 'novels') return work.type === 'wattpad'
        if (source === 'arts') return work.type === 'art'
        if (source === 'shop' || source === 'commissions' || source === 'announcements') return false
        return work.type !== 'commission'
    })
}

function byDataSource(works: WorkItem[], widget: PageWidget) {
    const source = widget.settings.filter_cards_data ?? 'mixed'

    return works.filter((work) => {
        if (work.type === 'commission') return false
        if (source === 'mixed') return true
        if (source === 'comix') return work.type === 'webtoon'
        if (source === 'novels') return work.type === 'wattpad'
        if (source === 'arts') return work.type === 'art'
        return true
    }) as (WorkItem & { type: 'webtoon' | 'wattpad' | 'art' })[]
}

function applyFilters(works: ReturnType<typeof byDataSource>, widget: PageWidget) {
    const settings = widget.settings ?? {}
    const dailyDate = settings.daily_date
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = (settings.label_filter_values ?? [])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()
    const filtered = works.filter((work) => {
        if (dailyDate && !isSameDate(work.created_at, dailyDate)) return false
        const matches = (source: string, value: string) => {
            if (!value || source === 'none') return true
            if (source === 'status') return String(work.status ?? '').toLowerCase() === value
            if (source === 'genre' || source === 'label') {
                return (work.genres ?? []).some((label) => label.toLowerCase() === value)
            }
            return source !== 'commission_type'
        }
        const multiOk =
            multiSource === 'none' || multiValues.length === 0
                ? true
                : multiValues.some((value) => matches(multiSource, value))
        const badgeOk = badgeSource === 'none' || !badgeValue ? true : matches(badgeSource, badgeValue)

        return multiOk && badgeOk
    })

    return sortWorks(filtered, widget)
}

function isSameDate(value: string | undefined, date: string) {
    if (!value || !date) return false
    return value.slice(0, 10) === date
}

function sortWorks(works: ReturnType<typeof byDataSource>, widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...works].sort((a, b) => {
        for (const sort of sorts) {
            const value = compareBySort(a, b, sort)
            if (value !== 0) return value
        }

        return 0
    })
}

function compareBySort(a: WorkItem, b: WorkItem, sort: string) {
    if (sort === 'featured') return Number(b.is_featured) - Number(a.is_featured)
    if (sort === 'likes') return (b.likes ?? 0) - (a.likes ?? 0)
    if (sort === 'views' || sort === 'popular') return (b.views ?? 0) - (a.views ?? 0)
    if (sort === 'new' || sort === 'latest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    }
    return 0
}

function labelItemsFromWorks(works: WorkItem[]) {
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

function SharedWorkGrid({
    title,
    works,
    cover,
    metric,
    columns,
    infoLayout = 'image_title_description',
}: {
    title: string
    works: WorkItem[]
    cover: (path: string | null, variant?: 'sm') => string | null
    metric?: 'views' | 'likes'
    columns?: number
    infoLayout?: string
}) {
    if (works.length === 0) return null

    return (
        <section className="mx-auto mt-10 w-full max-w-[1360px] px-5">
            <h2 className="py-5 text-2xl font-bold uppercase">{title}</h2>
            <div
                style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
                className="grid grid-cols-3 items-stretch gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6"
            >
                {works.map((work) => (
                    <Link key={`${work.content_type ?? 'work'}-${work.id}`} to={hrefFor(work)} className="group block h-full">
                        <article>
                            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                                {cover(work.cover, work.type === 'art' ? undefined : 'sm') && (
                                    <img
                                        src={cover(work.cover, work.type === 'art' ? undefined : 'sm')!}
                                        alt={work.title}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                )}
                            </div>
                            {infoLayout !== 'image_only' && (
                                <>
                                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">
                                        {work.title}
                                    </h3>
                                    {infoLayout === 'image_title_description' && (
                                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                            {labelFor(work, metric)}
                                        </p>
                                    )}
                                </>
                            )}
                        </article>
                    </Link>
                ))}
            </div>
        </section>
    )
}

function hrefFor(work: WorkItem) {
    if (work.type === 'art') return `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}`
    if (work.content_type === 'chapter' && work.chapter_slug) {
        return `/works/${work.slug}/chapters/${work.chapter_slug}`
    }
    return `/works/${work.slug}`
}

function labelFor(work: WorkItem, metric?: 'views' | 'likes') {
    if (work.content_type === 'chapter' && metric === 'likes') {
        return `Ch. ${work.chapter_order ?? ''} - ${work.period_likes ?? work.likes ?? 0} likes today`
    }
    if (work.content_type === 'chapter' && metric === 'views') {
        return `Ch. ${work.chapter_order ?? ''} - ${work.period_views ?? work.views ?? 0} views today`
    }
    if (work.content_type === 'chapter') return `Ch. ${work.chapter_order ?? ''}`
    if (metric === 'likes') return `${work.period_likes ?? work.likes ?? 0} likes`
    if (metric === 'views') return `${work.period_views ?? work.views ?? 0} views`
    return work.type === 'art' ? 'Art' : work.type === 'webtoon' ? 'Webtoon' : 'Novel'
}
