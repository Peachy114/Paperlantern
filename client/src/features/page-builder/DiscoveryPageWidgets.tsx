import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import AnnouncementWidget from '@/features/announcements/components/AnnouncementWidget'
import LatestChaptersSection from '@/features/work/components/LatestChaptersSection'
import FreshReleasesSection from '@/features/work/components/FreshReleasesSection'
import WeeklyChartSection from '@/features/work/components/WeeklyChartSection'
import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'
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
    return (
        <Suspense fallback={null}>
            {widgets
                .filter((widget) => widget.enabled)
                .map((widget) => (
                    <DiscoveryWidget key={widget.id} widget={widget} data={data} />
                ))}
        </Suspense>
    )
}

function DiscoveryWidget({ widget, data }: { widget: PageWidget; data: DiscoveryWidgetData }) {
    const filter = widget.settings.filter ?? 'all'
    const byType = (works: WorkItem[]) =>
        filter === 'all'
            ? works
            : works.filter((work) => {
                  if (filter === 'novel') return work.type === 'wattpad'
                  if (filter === 'art') return work.type === 'art'
                  return work.type === 'webtoon'
              })
    const limit = widget.settings.limit ?? 10

    if (widget.type === 'content_tabs') {
        return (
            <PageWidgetFrame widget={widget}>
                <ContentTabsWidget widget={widget} />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'featured_hero') {
        return (
            <PageWidgetFrame widget={widget}>
                <FeaturedHeroWidget
                    widget={widget}
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
                    widget={widget}
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
                    weeklyChart={byType(data.weeklyChart).slice(0, limit)}
                    cover={data.cover}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'fresh') {
        return (
            <PageWidgetFrame widget={widget}>
                <FreshReleasesSection
                    freshReleases={byType(data.freshReleases).slice(0, limit)}
                    cover={data.cover}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'latest') {
        return (
            <PageWidgetFrame widget={widget}>
                <LatestChaptersSection
                    latestChapters={data.latestChapters.slice(0, limit)}
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
                    works={byType(data.todayReleases.length ? data.todayReleases : data.dailyWorks).slice(0, limit)}
                    cover={data.cover}
                    columns={widget.settings.columns}
                    infoLayout={widget.settings.info_layout ?? 'image_title_description'}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'today_top') {
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
                    works={byType(source).slice(0, limit)}
                    cover={data.cover}
                    metric={widget.settings.metric ?? 'views'}
                    columns={widget.settings.columns}
                    infoLayout={widget.settings.info_layout ?? 'image_title_description'}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'popular') {
        return (
            <PageWidgetFrame widget={widget}>
                <DiscoveryWorkGrid
                    title={widget.title || 'Popular'}
                    works={byType(data.popularWorks).slice(0, limit)}
                    cover={data.cover}
                    columns={widget.settings.columns}
                    infoLayout={widget.settings.info_layout ?? 'image_title_description'}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'top_liker') {
        return (
            <PageWidgetFrame widget={widget}>
                <DiscoveryWorkGrid
                    title={widget.title || 'Top Liker'}
                    works={byType(data.topLikedWorks.length ? data.topLikedWorks : data.popularWorks).slice(0, limit)}
                    cover={data.cover}
                    columns={widget.settings.columns}
                    infoLayout={widget.settings.info_layout ?? 'image_title_description'}
                />
            </PageWidgetFrame>
        )
    }

    return <CustomPageWidget widget={widget} />
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
        <section className="mx-auto mt-10 w-full max-w-[1360px] px-5">
            <h2 className="py-5 text-2xl font-bold uppercase">{title}</h2>
            <div
                style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
                className="grid grid-cols-3 items-stretch gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6"
            >
                {works.map((work) => (
                    <Link key={work.id} to={hrefFor(work)} className="group block h-full">
                        <article>
                            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                                {cover(work.cover, work.type === 'art' ? undefined : 'sm') ? (
                                    <img
                                        src={cover(work.cover, work.type === 'art' ? undefined : 'sm')!}
                                        alt={work.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : null}
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
