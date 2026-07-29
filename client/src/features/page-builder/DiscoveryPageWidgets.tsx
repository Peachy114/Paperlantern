import { Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AnnouncementWidget from '@/features/announcements/components/AnnouncementWidget'
import LatestChaptersSection from '@/features/work/components/LatestChaptersSection'
import FreshReleasesSection from '@/features/work/components/FreshReleasesSection'
import WeeklyChartSection from '@/features/work/components/WeeklyChartSection'
import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import StickerShopWidget from '@/features/page-builder/StickerShopWidget'
import LabelRailWidget from '@/features/page-builder/LabelRailWidget'
import TabCardsWidget from '@/features/page-builder/TabCardsWidget'
import EpisodesWidget from '@/features/page-builder/EpisodesWidget'
import SharedDiscoveryWidget, {
    isSharedDiscoveryWidget,
} from '@/features/page-builder/SharedDiscoveryWidget'
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'
import {
    gridContinuationOffset,
    labelContinuationOffset,
} from '@/features/page-builder/continuation'
import type { ChapterItem, WorkItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'

interface DiscoveryWidgetData {
    hero: WorkItem[]
    weeklyChart: WorkItem[]
    todayReleases: WorkItem[]
    todayTopViews: WorkItem[]
    todayTopLikes: WorkItem[]
    freshReleases: WorkItem[]
    latestChapters: ChapterItem[]
    dailyWorks: WorkItem[]
    popularWorks: WorkItem[]
    topLikedWorks: WorkItem[]
    cover: (path: string | null, variant?: 'sm') => string | null
}

export function DiscoveryPageWidgets({
    widgets,
    data,
}: {
    widgets: PageWidget[]
    data: DiscoveryWidgetData
}) {
    const location = useLocation()
    const contentFilter = new URLSearchParams(location.search).get('content')
    const enabledWidgets = widgets.filter((widget) => widget.enabled)
    const labelItems = labelItemsFromWorks([
        ...data.hero,
        ...data.weeklyChart,
        ...data.freshReleases,
        ...data.popularWorks,
        ...data.topLikedWorks,
    ])

    return (
        <Suspense fallback={null}>
            {enabledWidgets.map((widget) => (
                <DiscoveryWidget
                    key={widget.id}
                    widget={widget}
                    data={data}
                    contentFilter={contentFilter}
                    widgets={enabledWidgets}
                    labels={labelItems}
                />
            ))}
        </Suspense>
    )
}

function DiscoveryWidget({
    widget,
    data,
    contentFilter,
    widgets,
}: {
    widget: PageWidget
    data: DiscoveryWidgetData
    contentFilter: string | null
    widgets: PageWidget[]
    labels: { label: string; count: number }[]
}) {
    const filter =
        normalizeContentFilter(contentFilter) ??
        (widget.settings.filter_cards_data === 'comix'
            ? 'webtoon'
            : widget.settings.filter_cards_data === 'novels'
              ? 'wattpad'
              : widget.settings.filter_cards_data === 'arts'
                ? 'art'
                : (widget.settings.filter ?? 'all'))
    const byType = (works: WorkItem[]) =>
        works
            .filter((work) => work.type !== 'commission')
            .filter((work) => {
                if (filter === 'all') return true
                if (filter === 'novel') return work.type === 'wattpad'
                if (filter === 'wattpad') return work.type === 'wattpad'
                if (filter === 'art') return work.type === 'art'
                if (filter === 'commission') return false
                return work.type === 'webtoon'
            }) as (WorkItem & { type: 'webtoon' | 'wattpad' | 'art' })[]
    const filteredWorks = (works: WorkItem[]) =>
        applyWidgetFilters(byType(works), widget) as (WorkItem & {
            type: 'webtoon' | 'wattpad' | 'art'
        })[]
    const limit = widget.settings.limit ?? 10
    const filteredWidget = contentFilteredWidget(widget, filter)
    const gridOffset = gridContinuationOffset(widgets, widget)

    if (widget.type === 'content_tabs') {
        return (
            <PageWidgetFrame widget={widget}>
                <ContentTabsWidget widget={widget} />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'tab_cards') {
        return (
            <PageWidgetFrame widget={widget}>
                <TabCardsWidget
                    widget={filteredWidget}
                    works={[
                        ...data.hero,
                        ...data.weeklyChart,
                        ...data.freshReleases,
                        ...data.popularWorks,
                        ...data.topLikedWorks,
                    ]}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'labels') {
        return (
            <PageWidgetFrame widget={widget}>
                <LabelWidgetBundle
                    widget={widget}
                    widgets={widgets}
                    works={[
                        ...data.hero,
                        ...data.weeklyChart,
                        ...data.freshReleases,
                        ...data.popularWorks,
                        ...data.topLikedWorks,
                    ]}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'episodes') {
        return (
            <PageWidgetFrame widget={widget}>
                <EpisodesWidget
                    widget={filteredWidget}
                    chapters={data.latestChapters}
                    cover={data.cover}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'featured_hero') {
        return (
            <PageWidgetFrame widget={widget}>
                <FeaturedHeroWidget
                    widget={filteredWidget}
                    works={[
                        ...data.hero,
                        ...data.weeklyChart,
                        ...data.freshReleases,
                        ...data.popularWorks,
                        ...data.topLikedWorks,
                    ]}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'group_hero') {
        return (
            <PageWidgetFrame widget={widget}>
                <GroupHeroWidget
                    widget={filteredWidget}
                    works={[
                        ...data.hero,
                        ...data.weeklyChart,
                        ...data.freshReleases,
                        ...data.popularWorks,
                        ...data.topLikedWorks,
                    ]}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'announcement_banner') {
        return (
            <PageWidgetFrame widget={widget}>
                <AnnouncementWidget audience="public" />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'weekly') {
        return (
            <PageWidgetFrame widget={widget}>
                <WeeklyChartSection
                    weeklyChart={filteredWorks(data.weeklyChart).slice(
                        gridOffset,
                        gridOffset + limit
                    )}
                    cover={data.cover}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'fresh') {
        return (
            <PageWidgetFrame widget={widget}>
                <FreshReleasesSection
                    freshReleases={filteredWorks(data.freshReleases).slice(
                        gridOffset,
                        gridOffset + limit
                    )}
                    cover={data.cover}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'latest') {
        return (
            <PageWidgetFrame widget={widget}>
                <LatestChaptersSection
                    latestChapters={filterChapters(data.latestChapters, widget).slice(0, limit)}
                    cover={data.cover}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'today_releases' || widget.type === 'daily') {
        return (
            <PageWidgetFrame widget={widget}>
                <DiscoveryWorkGrid
                    title={widget.title || "Today's Releases"}
                    works={filteredWorks(
                        data.todayReleases.length ? data.todayReleases : data.dailyWorks
                    ).slice(gridOffset, gridOffset + limit)}
                    cover={data.cover}
                    columns={widget.settings.columns}
                    infoLayout={widget.settings.info_layout ?? 'image_title_description'}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'today_top' || widget.type === 'top_10s') {
        const source =
            widget.settings.metric === 'likes'
                ? data.todayTopLikes.length
                    ? data.todayTopLikes
                    : data.topLikedWorks
                : data.todayTopViews.length
                  ? data.todayTopViews
                  : data.popularWorks

        return (
            <PageWidgetFrame widget={widget}>
                <DiscoveryWorkGrid
                    title={widget.title || "Today's Top 10"}
                    works={filteredWorks(source).slice(gridOffset, gridOffset + limit)}
                    cover={data.cover}
                    metric={widget.settings.metric ?? 'views'}
                    columns={widget.settings.columns}
                    infoLayout={widget.settings.info_layout ?? 'image_title_description'}
                />
            </PageWidgetFrame>
        )
    }

    if (
        widget.type === 'popular' ||
        widget.type === 'grid_image' ||
        widget.type === 'grid_con' ||
        widget.type === 'cards'
    ) {
        return (
            <PageWidgetFrame widget={widget}>
                <DiscoveryWorkGrid
                    title={widget.title || 'Popular'}
                    works={filteredWorks(data.popularWorks).slice(gridOffset, gridOffset + limit)}
                    cover={data.cover}
                    columns={widget.settings.columns}
                    infoLayout={widget.settings.info_layout ?? 'image_title_description'}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'shop_card') {
        return (
            <PageWidgetFrame widget={widget}>
                <ShopCardWidget widget={widget} />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'sticker_shop') {
        return (
            <PageWidgetFrame widget={widget}>
                <StickerShopWidget widget={widget} />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'top_liker') {
        return (
            <PageWidgetFrame widget={widget}>
                <DiscoveryWorkGrid
                    title={widget.title || 'Top Liker'}
                    works={filteredWorks(
                        data.topLikedWorks.length ? data.topLikedWorks : data.popularWorks
                    ).slice(gridOffset, gridOffset + limit)}
                    cover={data.cover}
                    columns={widget.settings.columns}
                    infoLayout={widget.settings.info_layout ?? 'image_title_description'}
                />
            </PageWidgetFrame>
        )
    }

    if (isSharedDiscoveryWidget(widget.type)) {
        return (
            <PageWidgetFrame widget={widget}>
                <SharedDiscoveryWidget widget={filteredWidget} widgets={widgets} />
            </PageWidgetFrame>
        )
    }

    return <CustomPageWidget widget={widget} />
}

function LabelWidgetBundle({
    widget,
    widgets,
    works,
}: {
    widget: PageWidget
    widgets: PageWidget[]
    works: WorkItem[]
}) {
    const display = widget.settings.labels_display ?? 'labels'
    const labels = labelItemsFromWorks(sourceFilteredWorks(works, widget))

    if (display === 'menu_label') {
        return (
            <LabelRailWidget
                widget={widget}
                labels={[
                    { label: 'Main' },
                    { label: 'Comix' },
                    { label: 'Novel' },
                    { label: 'Arts' },
                ]}
            />
        )
    }

    if (display === 'labels_cards') {
        return (
            <div>
                <LabelRailWidget
                    widget={widget}
                    labels={labels}
                    offset={labelContinuationOffset(widgets, widget)}
                />
                <TabCardsWidget widget={widget} works={works} />
            </div>
        )
    }

    return (
        <LabelRailWidget
            widget={widget}
            labels={labels}
            offset={labelContinuationOffset(widgets, widget)}
        />
    )
}

function sourceFilteredWorks(works: WorkItem[], widget: PageWidget) {
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

function applyWidgetFilters(works: WorkItem[], widget: PageWidget) {
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

function filterChapters(chapters: ChapterItem[], widget: PageWidget) {
    const source = widget.settings.filter_cards_data ?? 'mixed'

    return chapters.filter((chapter) => {
        if (!matchesDateWindow(chapter.created_at, widget)) return false
        if (source === 'comix') return chapter.work.type === 'webtoon'
        if (source === 'novels') return chapter.work.type === 'wattpad'
        return true
    })
}

function sortWidgetWorks(works: WorkItem[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...works].sort((a, b) => {
        for (const sort of sorts) {
            const value = compareWidgetSort(a, b, sort)
            if (value !== 0) return value
        }

        return 0
    })
}

function compareWidgetSort(a: WorkItem, b: WorkItem, sort: string) {
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

function normalizeContentFilter(contentFilter: string | null) {
    if (!contentFilter || contentFilter === 'all') return null
    if (contentFilter === 'webtoon') return 'webtoon'
    if (contentFilter === 'wattpad') return 'wattpad'
    if (contentFilter === 'art') return 'art'
    if (contentFilter === 'commission') return 'commission'
    return null
}

function contentFilteredWidget(widget: PageWidget, filter: string): PageWidget {
    if (filter === 'all') return widget

    return {
        ...widget,
        settings: {
            ...widget.settings,
            hero_source_arts: filter === 'art',
            hero_source_works: filter === 'webtoon',
            hero_source_novels: filter === 'wattpad',
            hero_source_commissions: filter === 'commission',
            hero_source_announcements: false,
            hero_source_shop: false,
            group_source_arts: filter === 'art',
            group_source_comix: filter === 'webtoon',
            group_source_novels: filter === 'wattpad',
            group_source_commissions: filter === 'commission',
        },
    }
}

function DiscoveryWorkGrid({
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
        <section className="mx-auto mt-10 w-full max-w-[1480px] px-5">
            <h2 className="py-5 text-2xl font-bold uppercase">{title}</h2>
            <div
                style={
                    columns
                        ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 lg:gap-6"
            >
                {works.map((work) => (
                    <Link key={work.id} to={hrefFor(work)} className="group block h-full">
                        <article>
                            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                                {cover(work.cover, work.type === 'art' ? undefined : 'sm') ? (
                                    <img
                                        src={
                                            cover(
                                                work.cover,
                                                work.type === 'art' ? undefined : 'sm'
                                            )!
                                        }
                                        alt={work.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : null}
                            </div>
                            {infoLayout !== 'image_only' && (
                                <>
                                    <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug">
                                        {work.title}
                                    </h3>
                                    {infoLayout === 'image_title_description' && (
                                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
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
