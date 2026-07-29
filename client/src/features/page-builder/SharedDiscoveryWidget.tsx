import { Link } from 'react-router-dom'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import LabelRailWidget from '@/features/page-builder/LabelRailWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import StickerShopWidget from '@/features/page-builder/StickerShopWidget'
import TabCardsWidget from '@/features/page-builder/TabCardsWidget'
import EpisodesWidget from '@/features/page-builder/EpisodesWidget'
import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import LatestChaptersSection from '@/features/work/components/LatestChaptersSection'
import FreshReleasesSection from '@/features/work/components/FreshReleasesSection'
import WeeklyChartSection from '@/features/work/components/WeeklyChartSection'
import { useHome, type ChapterItem, type WorkItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'
import { gridContinuationOffset, labelContinuationOffset } from './continuation'

const SHARED_TYPES = new Set([
    'active_discussions',
    'beginner_manga',
    'best_murim',
    'best_novels',
    'content_tabs',
    'christmas_collection',
    'coming_soon',
    'completed_series',
    'continue_reading',
    'editors_picks',
    'tab_cards',
    'episodes',
    'fresh',
    'halloween_specials',
    'hidden_gems',
    'highest_rated',
    'labels',
    'weekly',
    'weekly_cards',
    'weekly_hero',
    'daily',
    'today_releases',
    'today_top',
    'latest',
    'latest_comments',
    'latest_comic_chapters',
    'latest_novel_chapters',
    'latest_reviews',
    'monthly_ranking',
    'most_bookmarked',
    'most_discussed',
    'most_favorited',
    'most_followed',
    'most_popular',
    'most_read',
    'most_reviewed',
    'most_shared',
    'most_viewed',
    'new_series',
    'new_uploads',
    'popular',
    'popular_manga',
    'popular_manhua',
    'popular_manhwa',
    'popular_novels',
    'random_work',
    'reader_favorites',
    'recently_added',
    'recently_commented',
    'recently_updated',
    'recently_viewed',
    'recommended_for_you',
    'returning_series',
    'similar_series',
    'summer_picks',
    'top_liker',
    'top_reviewers',
    'top_this_month',
    'top_this_week',
    'top_this_year',
    'grid_image',
    'grid_con',
    'cards',
    'top_10s',
    'trending',
    'trending_manga',
    'trending_manhua',
    'trending_manhwa',
    'trending_novels',
    'trending_this_month',
    'trending_this_week',
    'trending_today',
    'valentines_romance',
    'winter_picks',
    'shop_card',
    'sticker_shop',
])

export function isSharedDiscoveryWidget(type: string) {
    return SHARED_TYPES.has(type)
}

export default function SharedDiscoveryWidget({
    widget,
    widgets = [widget],
    preview = false,
}: {
    widget: PageWidget
    widgets?: PageWidget[]
    preview?: boolean
}) {
    const home = useHome({ preview })
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
    if (widget.type === 'tab_cards') {
        return <TabCardsWidget widget={widget} works={allWorks} preview={preview} />
    }
    if (widget.type === 'episodes') {
        return <EpisodesWidget widget={widget} chapters={home.latestChapters} cover={home.cover} />
    }
    if (widget.type === 'weekly_hero') {
        return (
            <FeaturedHeroWidget
                widget={{
                    ...widget,
                    settings: {
                        ...widget.settings,
                        hero_source_announcements: false,
                        hero_source_shop: widget.settings.hero_source_shop ?? false,
                    },
                }}
                works={filteredWorks(home.weeklyChart).slice(gridOffset, gridOffset + limit)}
                preview={preview}
            />
        )
    }
    if (widget.type === 'shop_card') return <ShopCardWidget widget={widget} preview={preview} />
    if (widget.type === 'sticker_shop')
        return <StickerShopWidget widget={widget} preview={preview} />
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
                    <TabCardsWidget widget={widget} works={allWorks} preview={preview} />
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
    if (widget.type === 'weekly' || widget.type === 'weekly_cards') {
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
                freshReleases={filteredWorks(home.freshReleases).slice(
                    gridOffset,
                    gridOffset + limit
                )}
                cover={home.cover}
            />
        )
    }
    if (widget.type === 'latest') {
        return (
            <LatestChaptersSection
                latestChapters={filterChapters(home.latestChapters, widget).slice(0, limit)}
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
                works={filteredWorks(
                    home.topLikedWorks.length ? home.topLikedWorks : home.popularWorks
                ).slice(gridOffset, gridOffset + limit)}
                cover={home.cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    }
    const genericSource = sourceForWidget(widget, home)
    if (
        [
            'active_discussions',
            'beginner_manga',
            'best_murim',
            'best_novels',
            'cards',
            'christmas_collection',
            'coming_soon',
            'completed_series',
            'continue_reading',
            'editors_picks',
            'grid_image',
            'grid_con',
            'halloween_specials',
            'hidden_gems',
            'highest_rated',
            'latest_comments',
            'latest_comic_chapters',
            'latest_novel_chapters',
            'latest_reviews',
            'monthly_ranking',
            'most_bookmarked',
            'most_discussed',
            'most_favorited',
            'most_followed',
            'most_popular',
            'most_read',
            'most_reviewed',
            'most_shared',
            'most_viewed',
            'new_series',
            'new_uploads',
            'popular',
            'popular_manga',
            'popular_manhua',
            'popular_manhwa',
            'popular_novels',
            'random_work',
            'reader_favorites',
            'recently_added',
            'recently_commented',
            'recently_updated',
            'recently_viewed',
            'recommended_for_you',
            'returning_series',
            'similar_series',
            'summer_picks',
            'top_reviewers',
            'top_this_month',
            'top_this_week',
            'top_this_year',
            'trending',
            'trending_manga',
            'trending_manhua',
            'trending_manhwa',
            'trending_novels',
            'trending_this_month',
            'trending_this_week',
            'trending_today',
            'valentines_romance',
            'winter_picks',
        ].includes(widget.type)
    ) {
        return (
            <SharedWorkGrid
                title={widget.title || titleForWidget(widget.type)}
                works={filteredWorks(genericSource).slice(gridOffset, gridOffset + limit)}
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
        if (source === 'shop' || source === 'commissions' || source === 'announcements')
            return false
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
                return (work.genres ?? []).some((label) => label.toLowerCase() === value)
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

    return sortWorks(filtered, widget)
}

function sourceForWidget(widget: PageWidget, home: ReturnType<typeof useHome>) {
    if (['new_series', 'recently_added', 'new_uploads'].includes(widget.type))
        return home.freshReleases
    if (['latest_comic_chapters', 'latest_novel_chapters'].includes(widget.type)) {
        return home.latestChapters.map((chapter) => ({
            id: chapter.id,
            slug: chapter.work.slug,
            title: chapter.title,
            cover: chapter.cover ?? chapter.work.cover,
            banner: chapter.cover ?? chapter.work.cover,
            type: chapter.work.type,
            content_type: 'chapter',
            chapter_slug: String(chapter.order),
            release_title: chapter.work.title,
            chapter_order: chapter.order,
            created_at: chapter.created_at,
        })) as WorkItem[]
    }
    if (
        [
            'top_this_month',
            'top_this_week',
            'top_this_year',
            'trending',
            'trending_manga',
            'trending_manhua',
            'trending_manhwa',
            'trending_novels',
            'trending_this_month',
            'trending_this_week',
            'trending_today',
        ].includes(widget.type)
    ) {
        return home.weeklyChart.length ? home.weeklyChart : home.popularWorks
    }
    if (
        [
            'highest_rated',
            'hidden_gems',
            'most_bookmarked',
            'most_discussed',
            'most_favorited',
            'most_followed',
            'most_popular',
            'most_read',
            'most_reviewed',
            'most_shared',
            'most_viewed',
            'popular_manga',
            'popular_manhua',
            'popular_manhwa',
            'popular_novels',
        ].includes(widget.type)
    ) {
        return home.popularWorks
    }
    return home.popularWorks.length ? home.popularWorks : home.freshReleases
}

function titleForWidget(type: string) {
    return type
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

function matchesDateWindow(value: string | undefined, widget: PageWidget) {
    const mode = widget.settings.date_mode ?? 'all'
    const dateValue = widget.settings.date_value || widget.settings.daily_date
    if (mode === 'all' || !value) return true

    const date = new Date(value)
    const base = dateValue ? new Date(dateValue) : new Date()
    if (Number.isNaN(date.getTime()) || Number.isNaN(base.getTime())) return true

    if (mode === 'daily') return date.toISOString().slice(0, 10) === base.toISOString().slice(0, 10)
    if (mode === 'weekly') {
        const diff = Math.abs(date.getTime() - base.getTime())
        return diff <= 7 * 24 * 60 * 60 * 1000
    }
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
        <section className="mx-auto mt-10 w-full max-w-[1480px] px-4 sm:px-6">
            <h2 className="py-5 text-2xl font-bold uppercase">{title}</h2>
            <div
                style={
                    columns
                        ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5"
            >
                {works.map((work) => (
                    <Link
                        key={`${work.content_type ?? 'work'}-${work.id}`}
                        to={hrefFor(work)}
                        className="group block h-full"
                    >
                        <article className="h-full">
                            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                                {cover(work.cover, work.type === 'art' ? undefined : 'sm') && (
                                    <img
                                        src={
                                            cover(
                                                work.cover,
                                                work.type === 'art' ? undefined : 'sm'
                                            )!
                                        }
                                        alt={work.title}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                )}
                            </div>
                            {infoLayout !== 'image_only' && (
                                <>
                                    <h3 className="mt-2.5 line-clamp-2 text-base font-semibold leading-snug">
                                        {work.title}
                                    </h3>
                                    {infoLayout === 'image_title_description' && (
                                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
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
