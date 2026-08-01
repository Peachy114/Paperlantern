import type { WorkItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'
import { normalizeContentFilter } from './utils/normalizeContentFilter'
import type { DiscoveryWidgetData } from './types'
import { applyWidgetFilters } from './utils/applyWidgetFilters'
import { contentFilteredWidget } from './utils/contentFilteredWidget'
import { gridContinuationOffset } from '../continuation'
import { CustomPageWidget, PageWidgetFrame } from '../PageWidgetFrame'
import ContentTabsWidget from '../ContentTabsWidget'

import AnnouncementWidget from '@/features/announcements/components/AnnouncementWidget'
import FreshReleasesSection from '@/features/work/components/FreshReleasesSection'
import LatestChaptersSection from '@/features/work/components/LatestChaptersSection'
import WeeklyChartSection from '@/features/work/components/WeeklyChartSection'

import EpisodesWidget from '../EpisodesWidget'
import FeaturedHeroWidget from '../FeaturedHeroWidget'
import GroupHeroWidget from '../GroupHeroWidget'
import SharedDiscoveryWidget, { isSharedDiscoveryWidget } from '../SharedDiscoveryWidget'
import ShopCardWidget from '../ShopCardWidget'
import StickerShopWidget from '../StickerShopWidget'
import TabCardsWidget from '../TabsCardsWidgets/TabCardsWidget'
import { DiscoveryWorkGrid } from './DiscoveryWorkGrid'
import LabelWidgetBundle from './LabelWidgetBundle'
import { filterChapters } from './utils/filterChapters'



export default function DiscoveryWidget({
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