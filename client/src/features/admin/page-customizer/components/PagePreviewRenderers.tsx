import { useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { CustomPageWidgetContent, cssColor, fontFamilyFromUrl } from '@/features/page-builder/PageWidgetFrame'
import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import LabelRailWidget from '@/features/page-builder/LabelRailWidget'
import TabCardsWidget from '@/features/page-builder/TabsCardsWidgets/TabCardsWidget'
import EpisodesWidget from '@/features/page-builder/EpisodesWidget'
import SharedDiscoveryWidget, { isSharedDiscoveryWidget } from '@/features/page-builder/SharedDiscoveryWidget'
import { gridContinuationOffset, labelContinuationOffset } from '@/features/page-builder/continuation'
import AnnouncementWidget from '@/features/announcements/components/AnnouncementWidget'
import HeroSection from '@/features/work/components/HeroSection'
import WeeklyChartSection from '@/features/work/components/WeeklyChartSection'
import FreshReleasesSection from '@/features/work/components/FreshReleasesSection'
import LatestChaptersSection from '@/features/work/components/LatestChaptersSection'
import type { WorkItem } from '@/features/work/hooks/useHome'
import type { PageBoardItem, PageKey, PageWidget } from '@/types/pageLayout'
import type { ArtsPreviewData, CommissionPreviewData, HomePreviewData } from '@/features/admin/page-customizer/types/preview'
import {
    applyPreviewArtFilters,
    applyPreviewCommissionFilters,
    applyPreviewWidgetFilters,
    filterPreviewChapters,
    labelItemsFromWorks,
    sourceFilteredPreviewWorks,
} from '@/features/admin/page-customizer/utils/previewFilters'
import {
    clamp,
    createRafPointerMove,
} from '@/features/admin/page-customizer/utils/editorInteraction'
import { storageUrl } from '@/utils/storage'

// Page preview renderers ----
export function WidgetContent({
    page,
    widget,
    widgets,
    homeData,
    artsData,
    commissionData,
    onChange,
}: {
    page: PageKey
    widget: PageWidget
    widgets: PageWidget[]
    homeData?: HomePreviewData
    artsData?: ArtsPreviewData
    commissionData?: CommissionPreviewData
    onChange: (updater: (widget: PageWidget) => PageWidget) => void
}) {
    if (!widget.enabled) {
        return null
    }

    if (widget.type === 'content_tabs') {
        return <ContentTabsWidget widget={widget} />
    }

    if (widget.type === 'tab_cards') {
        return <TabCardsWidget widget={widget} preview />
    }

    if (widget.type === 'board') {
        return <EditableBoardWidget widget={widget} onChange={onChange} />
    }

    if (['text', 'image', 'banner', 'sticker', 'spacer'].includes(widget.type)) {
        return <CustomContentWidget widget={widget} />
    }

    if (['home', 'comix', 'novels', 'daily', 'rankings', 'genre'].includes(page)) {
        return <HomeWidget widget={widget} widgets={widgets} data={homeData} />
    }

    if (page === 'arts') {
        return <ArtsWidget widget={widget} widgets={widgets} data={artsData} />
    }

    return <CommissionWidget widget={widget} widgets={widgets} data={commissionData} />
}

function HomeWidget({
    widget,
    widgets,
    data,
}: {
    widget: PageWidget
    widgets: PageWidget[]
    data?: HomePreviewData
}) {
    const cover = (path: string | null, variant?: 'sm') => (path ? storageUrl(path, variant) : null)
    const filter =
        widget.settings.filter_cards_data === 'comix'
            ? 'webtoon'
            : widget.settings.filter_cards_data === 'novels'
              ? 'novel'
              : widget.settings.filter_cards_data === 'arts'
                ? 'art'
                : (widget.settings.filter ?? 'all')
    const byType = (works: WorkItem[] = []) =>
        works
            .filter((work) => work.type !== 'commission')
            .filter((work) => {
                if (filter === 'all') return true
                if (filter === 'novel') return work.type === 'wattpad'
                if (filter === 'art') return work.type === 'art'
                return work.type === 'webtoon'
            }) as (WorkItem & { type: 'webtoon' | 'wattpad' | 'art' })[]
    const filteredWorks = (works: WorkItem[] = []) =>
        applyPreviewWidgetFilters(byType(works), widget) as (WorkItem & {
            type: 'webtoon' | 'wattpad' | 'art'
        })[]
    const allWorks = [
        ...(data?.weeklyChart ?? []),
        ...(data?.freshReleases ?? []),
        ...(data?.popularWorks ?? []),
        ...(data?.topLikedWorks ?? []),
    ]
    const limit = widget.settings.limit ?? 10
    const gridOffset = gridContinuationOffset(widgets, widget)

    if (widget.type === 'hero') {
        return (
            <BuilderPreviewLabel label="Hero">
                <HeroSection audience="public" />
            </BuilderPreviewLabel>
        )
    }
    if (widget.type === 'featured_hero') {
        return (
            <BuilderPreviewLabel label="Featured Hero">
                <FeaturedHeroWidget widget={widget} works={allWorks} preview />
            </BuilderPreviewLabel>
        )
    }
    if (widget.type === 'group_hero') {
        return (
            <BuilderPreviewLabel label="Group Hero">
                <GroupHeroWidget widget={widget} works={allWorks} />
            </BuilderPreviewLabel>
        )
    }
    if (widget.type === 'announcement_hero') {
        return (
            <BuilderPreviewLabel label="Announcement Hero">
                <HeroSection audience="public" />
            </BuilderPreviewLabel>
        )
    }
    if (widget.type === 'announcement_banner') {
        return (
            <BuilderPreviewLabel label="Announcement Banner">
                <AnnouncementWidget audience="public" />
            </BuilderPreviewLabel>
        )
    }
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
                />
            )
        }

        if (widget.settings.labels_display === 'labels_cards') {
            return (
                <div>
                    <LabelRailWidget
                        widget={widget}
                        labels={labelItemsFromWorks(sourceFilteredPreviewWorks(allWorks, widget))}
                        offset={labelContinuationOffset(widgets, widget)}
                    />
                    <TabCardsWidget widget={widget} works={allWorks} preview />
                </div>
            )
        }

        return (
            <LabelRailWidget
                widget={widget}
                labels={labelItemsFromWorks(sourceFilteredPreviewWorks(allWorks, widget))}
                offset={labelContinuationOffset(widgets, widget)}
            />
        )
    }
    if (widget.type === 'episodes') {
        return (
            <EpisodesWidget
                widget={widget}
                chapters={filterPreviewChapters(data?.latestChapters ?? [], widget)}
                cover={cover}
            />
        )
    }
    if (widget.type === 'weekly')
        return (
            <WeeklyChartSection
                weeklyChart={filteredWorks(data?.weeklyChart).slice(gridOffset, gridOffset + limit)}
                cover={cover}
            />
        )
    if (widget.type === 'today_releases' || widget.type === 'daily') {
        const source = data?.todayReleases?.length ? data.todayReleases : data?.dailyWorks
        return (
            <WorkGrid
                title={widget.title || "Today's Releases"}
                works={filteredWorks(source).slice(gridOffset, gridOffset + limit)}
                cover={cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    }
    if (widget.type === 'today_top' || widget.type === 'top_10s') {
        const source =
            widget.settings.metric === 'likes' ? data?.todayTopLikes : data?.todayTopViews
        return (
            <WorkGrid
                title={widget.title || "Today's Top 10"}
                works={filteredWorks(source).slice(gridOffset, gridOffset + limit)}
                cover={cover}
                metric={widget.settings.metric ?? 'views'}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    }
    if (widget.type === 'fresh')
        return (
            <FreshReleasesSection
                freshReleases={filteredWorks(data?.freshReleases).slice(
                    gridOffset,
                    gridOffset + limit
                )}
                cover={cover}
            />
        )
    if (widget.type === 'latest')
        return (
            <LatestChaptersSection
                latestChapters={filterPreviewChapters(data?.latestChapters ?? [], widget).slice(
                    0,
                    limit
                )}
                cover={cover}
            />
        )
    if (
        widget.type === 'popular' ||
        widget.type === 'grid_image' ||
        widget.type === 'grid_con' ||
        widget.type === 'cards'
    )
        return (
            <WorkGrid
                title={widget.title}
                works={filteredWorks(data?.popularWorks).slice(gridOffset, gridOffset + limit)}
                cover={cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    if (widget.type === 'top_liker')
        return (
            <WorkGrid
                title={widget.title}
                works={filteredWorks(data?.topLikedWorks).slice(gridOffset, gridOffset + limit)}
                cover={cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    if (widget.type === 'shop_card') {
        return (
            <BuilderPreviewLabel label="Shop Card">
                <ShopCardWidget widget={widget} preview />
            </BuilderPreviewLabel>
        )
    }
    if (isSharedDiscoveryWidget(widget.type)) {
        return <SharedDiscoveryWidget widget={widget} widgets={widgets} preview />
    }

    return <EmptyWidget />
}

function WorkGrid({
    title,
    works,
    cover,
    compact = false,
    metric,
    columns,
    infoLayout = 'image_title',
}: {
    title: string
    works: WorkItem[]
    cover: (path: string | null, variant?: 'sm') => string | null
    compact?: boolean
    metric?: 'views' | 'likes'
    columns?: number
    infoLayout?: string
}) {
    if (works.length === 0) return <EmptyWidget />
    const hrefFor = (work: WorkItem) =>
        work.type === 'art'
            ? `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}`
            : work.content_type === 'chapter' && work.chapter_slug
              ? `/works/${work.slug}/chapters/${work.chapter_slug}`
              : `/works/${work.slug}`
    const imageFor = (work: WorkItem) => cover(work.cover, work.type === 'art' ? undefined : 'sm')
    const labelFor = (work: WorkItem) => {
        if (work.content_type === 'chapter' && metric === 'likes')
            return `Ch. ${work.chapter_order ?? ''} · ${work.period_likes ?? work.likes ?? 0} likes today`
        if (work.content_type === 'chapter' && metric === 'views')
            return `Ch. ${work.chapter_order ?? ''} · ${work.period_views ?? work.views ?? 0} views today`
        if (work.content_type === 'chapter')
            return `Ch. ${work.chapter_order ?? ''} · ${work.release_title ?? 'New chapter'}`
        if (metric === 'likes') return `${work.period_likes ?? work.likes ?? 0} likes today`
        if (metric === 'views') return `${work.period_views ?? work.views ?? 0} views today`
        return work.type === 'art' ? 'Art' : work.type === 'webtoon' ? 'Webtoon' : 'Novel'
    }

    return (
        <section className="mx-auto my-5 w-full max-w-[1480px] px-5">
            <h2 className="py-5 text-2xl font-bold uppercase">{title}</h2>
            <div
                style={
                    !compact && columns
                        ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className={
                    compact
                        ? 'flex items-stretch gap-3 overflow-x-auto pb-2'
                        : 'grid grid-cols-3 items-stretch gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6'
                }
            >
                {works.map((work, index) => (
                    <Link
                        key={work.id}
                        to={hrefFor(work)}
                        className={compact ? 'block h-full w-36 shrink-0' : 'block h-full'}
                    >
                        <PreviewInfoCard
                            image={imageFor(work)}
                            title={work.title}
                            description={labelFor(work)}
                            layout={infoLayout}
                            compact={compact}
                            rank={compact ? index + 1 : undefined}
                        />
                    </Link>
                ))}
            </div>
        </section>
    )
}

function ArtsWidget({
    widget,
    widgets,
    data,
}: {
    widget: PageWidget
    widgets: PageWidget[]
    data?: ArtsPreviewData
}) {
    const filteredArts = applyPreviewArtFilters(data?.arts.data ?? [], widget)
    const limit = widget.settings.limit ?? 10
    const gridOffset = gridContinuationOffset(widgets, widget)
    const artHeroWorks = filteredArts.map((art) => ({
        id: art.id,
        slug: art.slug,
        title: art.title,
        cover: art.images?.[0]?.image_path ?? art.image_path,
        banner: art.images?.[0]?.image_path ?? art.image_path,
        description: art.description ?? '',
        type: 'art',
        content_type: 'art',
        genres: art.labels ?? [],
        views: art.views ?? 0,
        likes: art.likes ?? 0,
        created_at: art.created_at,
        status: art.status,
        is_featured: Boolean(art.is_featured),
    })) as WorkItem[]

    if (widget.type === 'featured_hero') {
        return (
            <BuilderPreviewLabel label="Featured Hero">
                <FeaturedHeroWidget widget={widget} works={artHeroWorks} preview />
            </BuilderPreviewLabel>
        )
    }

    if (widget.type === 'group_hero') {
        return (
            <BuilderPreviewLabel label="Group Hero">
                <GroupHeroWidget widget={widget} works={artHeroWorks} />
            </BuilderPreviewLabel>
        )
    }

    if (widget.type === 'featured_artists') {
        const artists = data?.featured_artists ?? []
        if (artists.length === 0) return <EmptyWidget />

        return (
            <section className="mx-auto max-w-[1480px] px-5 py-6">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest">
                    {widget.title}
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {artists.map((artist) => (
                        <Link
                            key={artist.id}
                            to={`/artists/${artist.username}`}
                            className="w-44 shrink-0 rounded-lg border bg-muted/20 p-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 overflow-hidden rounded-full bg-primary text-primary-foreground">
                                    {artist.avatar ? (
                                        <img
                                            src={storageUrl(artist.avatar)!}
                                            alt={artist.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-sm font-bold">
                                            {artist.name[0] ?? 'A'}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{artist.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        @{artist.username}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        )
    }

    if (widget.type === 'labels') {
        const tags = data?.tags ?? []
        if (tags.length === 0) return <EmptyWidget />

        return (
            <LabelRailWidget
                widget={widget}
                labels={tags.map((tag) => ({ label: tag.label, count: tag.artists_count }))}
                offset={labelContinuationOffset(widgets, widget)}
            />
        )
    }

    if (widget.type === 'arts_grid' || widget.type === 'grid_con') {
        return (
            <ImageGrid
                title={widget.title}
                items={filteredArts.slice(gridOffset, gridOffset + limit).map((art) => ({
                    id: art.id,
                    title: art.title,
                    description: art.labels?.join(', ') ?? '',
                    image: art.images?.[0]?.image_path ?? art.image_path,
                }))}
                grid={widget.settings.grid ?? 'masonry'}
                columns={widget.settings.columns}
                limit={limit}
                infoLayout={widget.settings.info_layout ?? 'image_only'}
            />
        )
    }
    if (widget.type === 'shop_card') {
        return (
            <BuilderPreviewLabel label="Shop Card">
                <ShopCardWidget widget={widget} preview />
            </BuilderPreviewLabel>
        )
    }

    return <EmptyWidget />
}

function CommissionWidget({
    widget,
    widgets,
    data,
}: {
    widget: PageWidget
    widgets: PageWidget[]
    data?: CommissionPreviewData
}) {
    const filteredCommissions = applyPreviewCommissionFilters(data?.commissions.data ?? [], widget)
    const limit = widget.settings.limit ?? 10
    const gridOffset = gridContinuationOffset(widgets, widget)
    if (
        widget.type === 'commission_grid' ||
        widget.type === 'boosted_commissions' ||
        widget.type === 'grid_con'
    ) {
        const items =
            widget.type === 'boosted_commissions'
                ? filteredCommissions.filter((commission) => commission.boosted_until)
                : filteredCommissions

        return (
            <ImageGrid
                title={widget.title}
                items={items.slice(gridOffset, gridOffset + limit).map((commission) => ({
                    id: commission.id,
                    title: commission.title,
                    description: commission.status,
                    image: commission.image_path ?? commission.artist?.avatar ?? null,
                }))}
                grid={widget.settings.grid ?? 'masonry'}
                columns={widget.settings.columns}
                limit={limit}
                infoLayout={widget.settings.info_layout ?? 'image_only'}
            />
        )
    }
    if (widget.type === 'featured_hero') {
        return (
            <BuilderPreviewLabel label="Featured Hero">
                <FeaturedHeroWidget widget={widget} works={[]} preview />
            </BuilderPreviewLabel>
        )
    }
    if (widget.type === 'shop_card') {
        return (
            <BuilderPreviewLabel label="Shop Card">
                <ShopCardWidget widget={widget} preview />
            </BuilderPreviewLabel>
        )
    }
    if (isSharedDiscoveryWidget(widget.type)) {
        return <SharedDiscoveryWidget widget={widget} widgets={widgets} preview />
    }
    return <EmptyWidget />
}

function ImageGrid({
    title,
    items,
    grid,
    columns,
    limit = 10,
    infoLayout = 'image_only',
}: {
    title: string
    items: {
        id: string
        title: string
        description?: string
        image: string | null
    }[]
    grid: string
    columns?: number
    limit?: number
    infoLayout?: string
}) {
    if (items.length === 0) return <EmptyWidget />

    const content = items.slice(0, limit).map((item) => (
        <article
            key={item.id}
            className={grid === 'masonry' ? 'mb-4 break-inside-avoid' : 'h-full'}
        >
            <PreviewInfoCard
                image={item.image ? storageUrl(item.image)! : null}
                title={item.title}
                description={item.description}
                layout={infoLayout}
                imageClass="h-full w-full object-cover"
            />
        </article>
    ))

    return (
        <section className="mx-auto max-w-[1480px] px-5 py-6">
            <h2 className="mb-4 text-2xl font-bold">{title}</h2>
            <div
                style={
                    columns
                        ? grid === 'masonry'
                            ? { columnCount: columns }
                            : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className={
                    grid === 'masonry'
                        ? 'columns-2 gap-4 md:columns-3 lg:columns-4'
                        : grid === 'gallery'
                          ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
                          : 'grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5'
                }
            >
                {content}
            </div>
        </section>
    )
}

function PreviewInfoCard({
    image,
    title,
    description,
    layout,
    compact = false,
    rank,
    imageClass = 'h-full w-full object-cover',
}: {
    image: string | null
    title: string
    description?: string
    layout: string
    compact?: boolean
    rank?: number
    imageClass?: string
}) {
    const imageNode = (
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
            {image ? (
                <img src={image} alt={title} className={imageClass} />
            ) : (
                <div className="aspect-square" />
            )}
            {rank && (
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    #{rank}
                </span>
            )}
        </div>
    )
    const titleNode = (
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{title}</h3>
    )
    const descriptionNode = description ? (
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{description}</p>
    ) : null

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
            {layout === 'image_title' && compact && descriptionNode}
        </div>
    )
}

function CustomContentWidget({ widget }: { widget: PageWidget }) {
    return <CustomPageWidgetContent widget={widget} />
}

// ============================================================================
// SECTION 10: EDITABLE BOARD WIDGET AND BOARD ITEMS ----
// ============================================================================
function EditableBoardWidget({
    widget,
    onChange,
}: {
    widget: PageWidget
    onChange: (updater: (widget: PageWidget) => PageWidget) => void
}) {
    const width = widget.style.content_width ?? 960
    const height = widget.style.content_height ?? 420
    const selectedId = widget.settings.selected_board_item_id
    const items = widget.settings.board_items ?? []
    const [snapGuide, setSnapGuide] = useState<{ x: boolean; y: boolean }>({
        x: false,
        y: false,
    })

    const updateItem = (id: string, updater: (item: PageBoardItem) => PageBoardItem) => {
        onChange((current) => ({
            ...current,
            settings: {
                ...current.settings,
                selected_board_item_id: id,
                board_items: (current.settings.board_items ?? []).map((item) =>
                    item.id === id ? updater(item) : item
                ),
            },
        }))
    }

    const startDrag = (event: ReactPointerEvent<HTMLElement>, item: PageBoardItem) => {
        if ((event.target as HTMLElement).closest('[data-board-resize="true"]')) return
        event.preventDefault()
        event.stopPropagation()

        const board = event.currentTarget.parentElement
        const boardRect = board?.getBoundingClientRect()
        if (!boardRect) return

        const startX = event.clientX
        const startY = event.clientY
        const initialX = item.x
        const initialY = item.y
        const previousUserSelect = document.body.style.userSelect
        document.body.style.userSelect = 'none'

        const { move, cancel: cancelMove } = createRafPointerMove((moveEvent) => {
            const dxPercent = ((moveEvent.clientX - startX) / boardRect.width) * 100
            const dy = moveEvent.clientY - startY
            const rawX = clamp(initialX + dxPercent, 0, 100 - item.w)
            const rawY = clamp(initialY + dy, 0, height - item.h)
            const shouldSnapX = Math.abs(rawX + item.w / 2 - 50) <= 1.25
            const shouldSnapY = Math.abs(rawY + item.h / 2 - height / 2) <= 10
            const nextX = shouldSnapX ? clamp(50 - item.w / 2, 0, 100 - item.w) : rawX
            const nextY = shouldSnapY ? clamp(height / 2 - item.h / 2, 0, height - item.h) : rawY
            setSnapGuide({ x: shouldSnapX, y: shouldSnapY })
            updateItem(item.id, (current) => ({
                ...current,
                x: Number(nextX.toFixed(3)),
                y: Math.round(nextY),
            }))
        })

        const end = () => {
            cancelMove()
            setSnapGuide({ x: false, y: false })
            document.body.style.userSelect = previousUserSelect
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', end)
            window.removeEventListener('pointercancel', end)
        }

        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
    }

    const startResize = (event: ReactPointerEvent<HTMLElement>, item: PageBoardItem) => {
        event.preventDefault()
        event.stopPropagation()

        const board = event.currentTarget.closest<HTMLElement>('[data-page-board="true"]')
        const boardRect = board?.getBoundingClientRect()
        if (!boardRect) return

        const startX = event.clientX
        const startY = event.clientY
        const initialW = item.w
        const initialH = item.h
        const previousUserSelect = document.body.style.userSelect
        document.body.style.userSelect = 'none'

        const { move, cancel: cancelMove } = createRafPointerMove((moveEvent) => {
            const dwPercent = ((moveEvent.clientX - startX) / boardRect.width) * 100
            const dh = moveEvent.clientY - startY
            updateItem(item.id, (current) => ({
                ...current,
                w: Number(clamp(initialW + dwPercent, 4, 100 - current.x).toFixed(3)),
                h: Math.round(clamp(initialH + dh, 24, height - current.y)),
            }))
        })

        const end = () => {
            cancelMove()
            document.body.style.userSelect = previousUserSelect
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', end)
            window.removeEventListener('pointercancel', end)
        }

        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
    }

    return (
        <section className="w-full py-6">
            <div
                data-page-board="true"
                className="relative mx-auto overflow-hidden bg-background/70"
                style={{
                    width: `min(${width}px, 100%)`,
                    height: `${height}px`,
                    background: widget.style.transparent
                        ? 'transparent'
                        : (cssColor(widget.style.background) ?? 'transparent'),
                    border: widget.style.border
                        ? `1px solid ${cssColor(widget.style.border_color) ?? 'var(--border, #d4d4d8)'}`
                        : '1px dashed rgba(14, 165, 233, 0.45)',
                    borderRadius: `${widget.style.radius ?? 0}px`,
                    backgroundImage:
                        'linear-gradient(to right, rgba(14, 165, 233, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(14, 165, 233, 0.14) 1px, transparent 1px)',
                    backgroundSize: '5% 40px',
                }}
            >
                {items.length === 0 && (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Add stickers, images, or text from Board settings.
                    </div>
                )}
                {snapGuide.x && (
                    <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-[999] w-px bg-red-500" />
                )}
                {snapGuide.y && (
                    <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-[999] h-px bg-red-500" />
                )}
                {items.map((item) => {
                    const itemStyle = item.style ?? {}
                    const imagePath =
                        item.type === 'sticker'
                            ? item.sticker_image_path || item.asset_path
                            : item.asset_path
                    const src = imagePath ? storageUrl(imagePath) : null
                    const selected = selectedId === item.id

                    return (
                        <div
                            key={item.id}
                            onPointerDown={(event) => startDrag(event, item)}
                            className={`absolute cursor-move ${
                                selected
                                    ? 'outline outline-2 outline-sky-500'
                                    : 'outline outline-1 outline-transparent hover:outline-sky-400'
                            }`}
                            style={{
                                left: `${item.x}%`,
                                top: `${item.y}px`,
                                width: `${item.w}%`,
                                height: `${item.h}px`,
                                background: itemStyle.transparent
                                    ? 'transparent'
                                    : (cssColor(itemStyle.background) ?? 'transparent'),
                                border: itemStyle.border
                                    ? `1px solid ${cssColor(itemStyle.border_color) ?? 'var(--border, #d4d4d8)'}`
                                    : undefined,
                                borderRadius: `${itemStyle.radius ?? 0}px`,
                                padding: `${itemStyle.padding_block ?? itemStyle.padding ?? 0}px ${itemStyle.padding_inline ?? itemStyle.padding ?? 0}px`,
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                transform: itemStyle.rotate
                                    ? `rotate(${itemStyle.rotate}deg)`
                                    : undefined,
                                zIndex: itemStyle.z_index ?? 1,
                            }}
                        >
                            {item.type === 'text' ? (
                                <div
                                    className="h-full w-full whitespace-pre-line break-words"
                                    style={{
                                        color: cssColor(itemStyle.text_color),
                                        fontFamily:
                                            itemStyle.font_family ||
                                            fontFamilyFromUrl(item.font_url),
                                        fontSize: `${itemStyle.font_size ?? 16}px`,
                                        textAlign: itemStyle.text_align ?? 'start',
                                    }}
                                >
                                    {item.text}
                                </div>
                            ) : src ? (
                                <img
                                    src={src}
                                    alt=""
                                    draggable={false}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center rounded border bg-muted/60 text-xs text-muted-foreground">
                                    Select {item.type}
                                </div>
                            )}
                            {selected && (
                                <button
                                    type="button"
                                    data-board-resize="true"
                                    onPointerDown={(event) => startResize(event, item)}
                                    className="absolute -bottom-3 -right-3 h-7 w-7 cursor-nwse-resize rounded-full bg-white shadow ring-2 ring-sky-500"
                                    title="Resize board item"
                                    aria-label="Resize board item"
                                >
                                    <span className="absolute bottom-2 right-2 h-2.5 w-2.5 border-b-2 border-r-2 border-sky-500" />
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

function EmptyWidget() {
    return null
}

function BuilderPreviewLabel({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="relative">
            <div className="pointer-events-none absolute left-2 top-2 z-50">{label}</div>

            <div className="relative pointer-events-auto">{children}</div>
        </div>
    )
}

// ============================================================================
// SECTION 11: ALL WIDGET SETTINGS / RIGHT-SIDE INSPECTOR ----
// SETTINGS ARE GROUPED BELOW AS:
//   A. Content settings
//   B. Box style settings
//   C. Layout settings
// Add widget-specific controls inside the matching widget.type condition.
// ============================================================================


