import { Suspense, type ReactNode } from 'react'
import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import LabelRailWidget from '@/features/page-builder/LabelRailWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import StickerShopWidget from '@/features/page-builder/StickerShopWidget'
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'
import type { CommissionService } from '@/types/commission'
import type { PageWidget } from '@/types/pageLayout'
import type { WorkItem } from '@/features/work/hooks/useHome'
import CommissionGrid from '@/features/commissions/pages/components/commission_grid'
import { gridContinuationOffset } from './continuation'
import SharedDiscoveryWidget, { isSharedDiscoveryWidget } from './SharedDiscoveryWidget'
import { SAMPLE_COMMISSIONS } from '@/features/page-builder/samplePageData'

type CommissionCategory = {
    id: string
    name: string
    slug: string
}

export interface CommissionWidgetData {
    commissions: CommissionService[]
    featuredCommissions?: CommissionService[]
    boostedCommissions?: CommissionService[]
    categories?: CommissionCategory[]
    activeCategory?: string
    onCategoryChange?: (value: string) => void
    isLoading: boolean
    onOpen: (commission: CommissionService) => void
}

export function CommissionPageWidgets({
    widgets,
    data,
    preview = false,
}: {
    widgets: PageWidget[]
    data: CommissionWidgetData
    preview?: boolean
}) {
    return (
        <Suspense fallback={null}>
            {widgets
                .filter((widget) => widget.enabled)
                .map((widget) => (
                    <CommissionWidget
                        key={widget.id}
                        widget={widget}
                        widgets={widgets}
                        data={data}
                        preview={preview}
                    />
                ))}
        </Suspense>
    )
}

function CommissionWidget({
    widget,
    widgets,
    data,
    preview,
}: {
    widget: PageWidget
    widgets: PageWidget[]
    data: CommissionWidgetData
    preview: boolean
}) {
    const limit = widget.settings.limit ?? 10
    const gridOffset = gridContinuationOffset(widgets, widget)
    const sourceCommissions =
        data.commissions.length || !preview ? data.commissions : SAMPLE_COMMISSIONS
    const categories = data.categories?.length
        ? data.categories
        : preview
          ? (SAMPLE_COMMISSIONS.map((commission) => commission.category).filter(
                Boolean
            ) as CommissionCategory[])
          : []
    const filteredCommissions = applyCommissionWidgetFilters(sourceCommissions, widget)

    const featuredCommissions = data.featuredCommissions?.length
        ? data.featuredCommissions
        : filteredCommissions.filter((commission) => Boolean(commission.is_featured))

    const boostedCommissions = data.boostedCommissions?.length
        ? data.boostedCommissions
        : filteredCommissions.filter((commission) => Boolean(commission.boosted_until))

    const heroCommissions =
        featuredCommissions.length > 0 ? featuredCommissions : filteredCommissions

    const heroWorks = heroCommissions.map(commissionToHeroWork)

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
                    works={heroWorks.slice(0, limit)}
                    preview={preview}
                />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'group_hero') {
        return (
            <PageWidgetFrame widget={widget}>
                <GroupHeroWidget widget={widget} works={heroWorks.slice(0, limit)} />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'labels') {
        const gridOwnsCategoryFilters = widgets.some((item) =>
            ['commission_grid', 'boosted_commissions', 'grid_con'].includes(item.type)
        )
        if (gridOwnsCategoryFilters) return null

        return (
            <PageWidgetFrame widget={widget}>
                <LabelRailWidget
                    widget={widget}
                    labels={categories.map((category) => ({
                        label: category.name,
                    }))}
                    activeLabel={
                        categories.find((category) => category.slug === data.activeCategory)
                            ?.name ?? ''
                    }
                    onSelect={(label) => {
                        const category = categories.find((item) => item.name === label)
                        data.onCategoryChange?.(category?.slug ?? '')
                    }}
                />
            </PageWidgetFrame>
        )
    }

    if (
        widget.type === 'commission_grid' ||
        widget.type === 'boosted_commissions' ||
        widget.type === 'grid_con'
    ) {
        const source =
            widget.type === 'boosted_commissions' ? boostedCommissions : filteredCommissions

        return (
            <section className="w-full overflow-hidden bg-gradient-to-br from-sky-50 via-background to-amber-50 px-3 sm:px-4  dark:from-sky-950/20 dark:via-background dark:to-amber-950/20">
                <div className="my-5 w-full max-w-[1480px] mx-auto">
                    <PageWidgetFrame widget={widget}>
                        <CommissionGridCategoryFilters
                            categories={categories}
                            activeCategory={data.activeCategory ?? ''}
                            onChange={data.onCategoryChange}
                        />

                        <CommissionGrid
                            commissions={source.slice(gridOffset, gridOffset + limit)}
                            isLoading={data.isLoading}
                            grid={widget.settings.grid ?? 'masonry'}
                            columns={widget.settings.columns}
                            infoLayout={widget.settings.info_layout ?? 'image_only'}
                            onOpen={data.onOpen}
                        />
                    </PageWidgetFrame>
                </div>
            </section>
        )
    }

    if (widget.type === 'shop_card') {
        return (
            <PageWidgetFrame widget={widget}>
                <ShopCardWidget widget={widget} preview={preview} />
            </PageWidgetFrame>
        )
    }

    if (widget.type === 'sticker_shop') {
        return (
            <PageWidgetFrame widget={widget}>
                <StickerShopWidget widget={widget} preview={preview} />
            </PageWidgetFrame>
        )
    }

    if (isSharedDiscoveryWidget(widget.type)) {
        return (
            <PageWidgetFrame widget={widget}>
                <SharedDiscoveryWidget widget={widget} widgets={widgets} preview={preview} />
            </PageWidgetFrame>
        )
    }

    return <CustomPageWidget widget={widget} />
}

function applyCommissionWidgetFilters(commissions: CommissionService[], widget: PageWidget) {
    const settings = widget.settings ?? {}
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = (settings.label_filter_values ?? [])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()

    const filtered = commissions.filter((commission) => {
        if (!matchesDateWindow(commission.created_at, widget)) return false
        const matches = (source: string, value: string) => {
            if (!value || source === 'none') return true
            if (source === 'status') return String(commission.status ?? '').toLowerCase() === value
            if (source === 'commission_type') {
                return (
                    commission.category?.name?.toLowerCase() === value ||
                    commission.category?.slug?.toLowerCase() === value
                )
            }
            return true
        }
        const multiOk =
            multiSource === 'none' || multiValues.length === 0
                ? true
                : multiValues.some((value) => matches(multiSource, value))
        const badgeOk =
            badgeSource === 'none' || !badgeValue ? true : matches(badgeSource, badgeValue)
        return multiOk && badgeOk
    })

    return sortCommissions(filtered, widget)
}

function sortCommissions(commissions: CommissionService[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...commissions].sort((a, b) => {
        for (const sort of sorts) {
            const value = compareCommissionSort(a, b, sort)
            if (value !== 0) return value
        }

        return 0
    })
}

function compareCommissionSort(a: CommissionService, b: CommissionService, sort: string) {
    if (sort === 'featured') return Number(b.is_featured) - Number(a.is_featured)
    if (sort === 'likes') return (b.likes_count ?? 0) - (a.likes_count ?? 0)
    if (sort === 'views' || sort === 'popular') {
        return (b.customers_count ?? 0) - (a.customers_count ?? 0)
    }
    if (sort === 'new' || sort === 'latest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    }
    return 0
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

function CommissionGridCategoryFilters({
    categories,
    activeCategory,
    onChange,
}: {
    categories: CommissionCategory[]
    activeCategory: string
    onChange?: (value: string) => void
}) {
    if (categories.length === 0) return null

    return (
        <div className="mb-6 flex flex-wrap gap-2">
            <FilterButton active={!activeCategory} onClick={() => onChange?.('')}>
                All types
            </FilterButton>

            {categories.map((category) => (
                <FilterButton
                    key={category.id}
                    active={activeCategory === category.slug}
                    onClick={() => onChange?.(category.slug)}
                >
                    {category.name}
                </FilterButton>
            ))}
        </div>
    )
}

function FilterButton({
    active,
    children,
    onClick,
}: {
    active: boolean
    children: ReactNode
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md border px-2.5 py-1 text-xs ${
                active
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
        >
            {children}
        </button>
    )
}

function commissionToHeroWork(commission: CommissionService): WorkItem {
    const image = commission.image_path ?? commission.artist?.avatar ?? null

    return {
        id: commission.id,
        slug: commission.slug,
        title: commission.title,
        description: commission.description ?? '',
        cover: image,
        banner: image,

        type: 'art',
        content_type: 'art',

        views: commission.views_count ?? 0,
        likes: commission.likes_count ?? 0,
        period_views: commission.views_count ?? 0,
        period_likes: commission.likes_count ?? 0,

        created_at: commission.created_at,
        updated_at: commission.updated_at,

        is_featured: Boolean(commission.is_featured),
    } as WorkItem
}
