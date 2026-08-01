import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import LabelRailWidget from '@/features/page-builder/LabelRailWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import StickerShopWidget from '@/features/page-builder/StickerShopWidget'
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'
import CommissionGrid from '@/features/commissions/pages/components/commission_grid'
import { gridContinuationOffset } from '../continuation'
import SharedDiscoveryWidget, { isSharedDiscoveryWidget } from '../SharedDiscoveryWidget'
import { SAMPLE_COMMISSIONS } from '@/features/page-builder/samplePageData'
import type { PageWidget } from '@/types/pageLayout'
import type { CommissionCategory } from './types'
import type { CommissionWidgetData } from './types'
import { applyCommissionWidgetFilters } from './utils/applyCommissionWidgetFilters'
import { commissionToHeroWork } from './utils/commissionToHeroWork'
import { CommissionGridCategoryFilters } from './CommissionGridCategoryFilters'

export default function CommissionWidget({
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