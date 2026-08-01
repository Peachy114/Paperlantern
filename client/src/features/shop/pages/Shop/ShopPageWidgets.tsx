import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'
import SharedDiscoveryWidget, { isSharedDiscoveryWidget } from '@/features/page-builder/SharedDiscoveryWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import StickerShopWidget from '@/features/page-builder/StickerShopWidget'
import type { PageWidget } from '@/types/pageLayout'

export function ShopPageWidgets({ widgets }: { widgets: PageWidget[] }) {
    return (
        <main className="w-full">
            {widgets.map((widget) => {
                if (widget.type === 'shop_card') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <ShopCardWidget widget={widget} />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'sticker_shop') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <StickerShopWidget widget={widget} />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'featured_hero') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <FeaturedHeroWidget widget={widget} works={[]} />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'group_hero') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <GroupHeroWidget widget={widget} works={[]} />
                        </PageWidgetFrame>
                    )
                }

                if (isSharedDiscoveryWidget(widget.type)) {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <SharedDiscoveryWidget widget={widget} widgets={widgets} />
                        </PageWidgetFrame>
                    )
                }

                return <CustomPageWidget key={widget.id} widget={widget} />
            })}
        </main>
    )
}