import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useHome } from '@/features/work/hooks/useHome'
import Welcome from '@/features/work/components/Welcome'
import HeroSection from '../components/HeroSection'
import AnnouncementWidget from '@/features/announcements/components/AnnouncementWidget'
import {
    CustomPageWidgetContent,
    PageWidgetFrame,
} from '@/features/page-builder/PageWidgetFrame'
import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import type { WorkItem } from '@/features/work/hooks/useHome'

const WeeklyChartSection = lazy(() => import('../components/WeeklyChartSection'))
const FreshReleasesSection = lazy(() => import('../components/FreshReleasesSection'))
const LatestChaptersSection = lazy(() => import('../components/LatestChaptersSection'))

export default function Homepage() {
    const {
        hero,
        weeklyChart,
        todayReleases,
        todayTopViews,
        todayTopLikes,
        freshReleases,
        latestChapters,
        dailyWorks,
        popularWorks,
        topLikedWorks,
        layout,
        cover,
        isLoading,
    } = useHome()

    const isEmpty =
        weeklyChart.length === 0 &&
        todayReleases.length === 0 &&
        todayTopViews.length === 0 &&
        freshReleases.length === 0 &&
        latestChapters.length === 0 &&
        hero.length === 0
    const enabledWidgets = (layout?.widgets ?? []).filter((widget) => widget.enabled)
    const hasPageBuilderLayout = enabledWidgets.length > 0
    const pageWidgets = enabledWidgets

    return (
        <>
            {!isLoading && isEmpty && !hasPageBuilderLayout ? (
                <Welcome />
            ) : (
                <div className="relative w-full">
                    <Suspense fallback={null}>
                        {pageWidgets.map((widget) => {
                            const filter =
                                widget.settings.filter_cards_data === 'comix'
                                    ? 'webtoon'
                                    : widget.settings.filter_cards_data === 'novels'
                                      ? 'novel'
                                      : widget.settings.filter_cards_data === 'arts'
                                        ? 'art'
                                        : widget.settings.filter ?? 'all'
                            const byType = (works: WorkItem[]) =>
                                works
                                    .filter((work) => work.type !== 'commission')
                                    .filter((work) => {
                                        if (filter === 'all') return true
                                        if (filter === 'novel') return work.type === 'wattpad'
                                        if (filter === 'art') return work.type === 'art'
                                        return work.type === 'webtoon'
                                    }) as (WorkItem & { type: 'webtoon' | 'wattpad' | 'art' })[]
                            const filteredWorks = (works: WorkItem[]) =>
                                applyWidgetFilters(byType(works), widget) as (WorkItem & {
                                    type: 'webtoon' | 'wattpad' | 'art'
                                })[]
                            const limit = widget.settings.limit ?? 10

                            if (widget.type === 'hero') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <HeroSection audience="public" />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'featured_hero') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <FeaturedHeroWidget
                                            widget={widget}
                                            works={[...hero, ...weeklyChart, ...freshReleases, ...popularWorks, ...topLikedWorks]}
                                        />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'group_hero') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <GroupHeroWidget
                                            widget={widget}
                                            works={[...hero, ...weeklyChart, ...freshReleases, ...popularWorks, ...topLikedWorks]}
                                        />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'announcement_hero') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <HeroSection audience="public" />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'announcement_banner') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <AnnouncementWidget audience="public" />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'content_tabs') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <ContentTabsWidget widget={widget} />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'weekly') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <WeeklyChartSection weeklyChart={filteredWorks(weeklyChart).slice(0, limit)} cover={cover} />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'fresh') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <FreshReleasesSection freshReleases={filteredWorks(freshReleases).slice(0, limit)} cover={cover} />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'latest') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <LatestChaptersSection latestChapters={latestChapters.slice(0, limit)} cover={cover} />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'daily') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <HomeWorkGrid title={widget.title || "Today's Releases"} works={filteredWorks(todayReleases.length ? todayReleases : dailyWorks).slice(0, limit)} cover={cover} columns={widget.settings.columns} infoLayout={widget.settings.info_layout ?? 'image_title_description'} />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'today_releases') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <HomeWorkGrid title={widget.title || "Today's Releases"} works={filteredWorks(todayReleases.length ? todayReleases : dailyWorks).slice(0, limit)} cover={cover} columns={widget.settings.columns} infoLayout={widget.settings.info_layout ?? 'image_title_description'} />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'today_top' || widget.type === 'top_10s') {
                                const source = widget.settings.metric === 'likes'
                                    ? (todayTopLikes.length ? todayTopLikes : topLikedWorks)
                                    : (todayTopViews.length ? todayTopViews : popularWorks)

                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <HomeWorkGrid title={widget.title || "Today's Top 10"} works={filteredWorks(source).slice(0, limit)} cover={cover} metric={widget.settings.metric ?? 'views'} columns={widget.settings.columns} infoLayout={widget.settings.info_layout ?? 'image_title_description'} />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'popular' || widget.type === 'grid_image' || widget.type === 'cards') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <HomeWorkGrid title={widget.title || 'Popular'} works={filteredWorks(popularWorks).slice(0, limit)} cover={cover} columns={widget.settings.columns} infoLayout={widget.settings.info_layout ?? 'image_title_description'} />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'shop_card') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <ShopCardWidget widget={widget} />
                                    </PageWidgetFrame>
                                )
                            }

                            if (widget.type === 'top_liker') {
                                return (
                                    <PageWidgetFrame key={widget.id} widget={widget}>
                                        <HomeWorkGrid title={widget.title || 'Top Liker'} works={filteredWorks(topLikedWorks.length ? topLikedWorks : popularWorks).slice(0, limit)} cover={cover} columns={widget.settings.columns} infoLayout={widget.settings.info_layout ?? 'image_title_description'} />
                                    </PageWidgetFrame>
                                )
                            }

                            return (
                                <PageWidgetFrame key={widget.id} widget={widget}>
                                    <CustomPageWidgetContent widget={widget} />
                                </PageWidgetFrame>
                            )
                        })}
                    </Suspense>
                </div>
            )}
        </>
    )
}

function applyWidgetFilters(works: WorkItem[], widget: { settings: any }) {
    const settings = widget.settings ?? {}
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = ((settings.label_filter_values ?? []) as string[])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()

    return works.filter((work) => {
        const matches = (source: string, value: string) => {
            if (!value || source === 'none') return true
            if (source === 'status') return String(work.status ?? '').toLowerCase() === value
            if (source === 'genre' || source === 'label') {
                return (work.genres ?? []).some((genre) => genre.toLowerCase() === value)
            }
            if (source === 'commission_type') return false
            return true
        }

        const multiOk =
            multiSource === 'none' || multiValues.length === 0
                ? true
                : multiValues.some((value) => matches(multiSource, value))
        const badgeOk = badgeSource === 'none' || !badgeValue ? true : matches(badgeSource, badgeValue)

        return multiOk && badgeOk
    })
}

function HomeWorkGrid({
    title,
    works,
    cover,
    compact = false,
    metric,
    columns,
    infoLayout = 'image_title_description',
}: {
    title: string
    works: WorkItem[]
    cover: (path: string | null, variant?: 'sm') => string | null
    compact?: boolean
    metric?: 'views' | 'likes'
    columns?: number
    infoLayout?: string
}) {
    if (works.length === 0) return null
    const hrefFor = (work: WorkItem) => {
        if (work.type === 'art') return `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}`
        if (work.content_type === 'chapter' && work.chapter_slug) return `/works/${work.slug}/chapters/${work.chapter_slug}`
        return `/works/${work.slug}`
    }
    const imageFor = (work: WorkItem) => cover(work.cover, work.type === 'art' ? undefined : 'sm')
    const labelFor = (work: WorkItem) => {
        if (work.content_type === 'chapter' && metric === 'likes') return `Ch. ${work.chapter_order ?? ''} · ${work.period_likes ?? work.likes ?? 0} likes today`
        if (work.content_type === 'chapter' && metric === 'views') return `Ch. ${work.chapter_order ?? ''} · ${work.period_views ?? work.views ?? 0} views today`
        if (work.content_type === 'chapter') return `Ch. ${work.chapter_order ?? ''} · ${work.release_title ?? 'New chapter'}`
        if (metric === 'likes') return `${work.period_likes ?? work.likes ?? 0} likes today`
        if (metric === 'views') return `${work.period_views ?? work.views ?? 0} views today`
        return work.type === 'art' ? 'Art' : work.type === 'webtoon' ? 'Webtoon' : 'Novel'
    }

    return (
        <section className="mt-10 w-full max-w-[1360px] mx-auto px-5">
            <h2 className="text-2xl font-bold uppercase py-5">{title}</h2>
            <div
                style={
                    !compact && columns
                        ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className={compact ? 'flex items-stretch gap-3 overflow-x-auto pb-2' : 'grid grid-cols-3 items-stretch gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6'}
            >
                {works.map((work, index) => (
                    <Link
                        key={work.id}
                        to={hrefFor(work)}
                        className={compact ? 'group block h-full w-36 shrink-0' : 'group block h-full'}
                    >
                        <HomeInfoCard
                            image={imageFor(work)}
                            title={work.title}
                            description={labelFor(work)}
                            layout={infoLayout}
                            rank={compact ? index + 1 : undefined}
                        />
                    </Link>
                ))}
            </div>
        </section>
    )
}

function HomeInfoCard({
    image,
    title,
    description,
    layout,
    rank,
}: {
    image: string | null
    title: string
    description: string
    layout: string
    rank?: number
}) {
    const imageNode = (
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
            {image && (
                <img
                    src={image}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            )}
            {rank && (
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    #{rank}
                </span>
            )}
        </div>
    )
    const titleNode = <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{title}</h3>
    const descriptionNode = <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{description}</p>

    if (layout === 'image_only') return imageNode
    if (layout === 'image_title_inline') {
        return (
            <div className="flex h-full items-center gap-3">
                <div className="w-20 shrink-0">{imageNode}</div>
                <div className="min-w-0">
                    {titleNode}
                    {descriptionNode}
                </div>
            </div>
        )
    }
    if (layout === 'title_image') {
        return (
            <div className="flex h-full flex-col">
                {titleNode}
                {imageNode}
                {descriptionNode}
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col">
            {imageNode}
            {titleNode}
            {layout === 'image_title_description' && descriptionNode}
        </div>
    )
}
