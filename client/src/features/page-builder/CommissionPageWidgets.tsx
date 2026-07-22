import { Suspense, type ReactNode } from 'react'
import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'
import type { CommissionService } from '@/types/commission'
import type { PageWidget } from '@/types/pageLayout'
import type { WorkItem } from '@/features/work/hooks/useHome'
import CommissionGrid from '@/features/commissions/pages/components/commission_grid'

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
}: {
    widgets: PageWidget[]
    data: CommissionWidgetData
}) {
    return (
        <Suspense fallback={null}>
            {widgets
                .filter((widget) => widget.enabled)
                .map((widget) => (
                    <CommissionWidget key={widget.id} widget={widget} data={data} />
                ))}
        </Suspense>
    )
}

function CommissionWidget({ widget, data }: { widget: PageWidget; data: CommissionWidgetData }) {
    const limit = widget.settings.limit ?? 10
    const filteredCommissions = applyCommissionWidgetFilters(data.commissions, widget)

    const featuredCommissions = data.featuredCommissions?.length
        ? data.featuredCommissions
        : filteredCommissions.filter((commission) => Boolean(commission.is_featured))

    const boostedCommissions = data.boostedCommissions?.length
        ? data.boostedCommissions
        : filteredCommissions.filter((commission) => Boolean(commission.boosted_until))

    const heroCommissions = featuredCommissions.length > 0 ? featuredCommissions : filteredCommissions

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
                <FeaturedHeroWidget widget={widget} works={heroWorks.slice(0, limit)} />
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

    if (widget.type === 'commission_grid' || widget.type === 'boosted_commissions') {
        const source = widget.type === 'boosted_commissions' ? boostedCommissions : filteredCommissions

        return (
            <PageWidgetFrame widget={widget}>
                <CommissionGridCategoryFilters
                    categories={data.categories ?? []}
                    activeCategory={data.activeCategory ?? ''}
                    onChange={data.onCategoryChange}
                />

                <CommissionGrid
                    commissions={source.slice(0, limit)}
                    isLoading={data.isLoading}
                    grid={widget.settings.grid ?? 'masonry'}
                    columns={widget.settings.columns}
                    infoLayout={widget.settings.info_layout ?? 'image_only'}
                    onOpen={data.onOpen}
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

    return commissions.filter((commission) => {
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
        const badgeOk = badgeSource === 'none' || !badgeValue ? true : matches(badgeSource, badgeValue)
        return multiOk && badgeOk
    })
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
