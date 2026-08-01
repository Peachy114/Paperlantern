import type { PageWidget } from "@/types/pageLayout"
import { HeroActionCard } from "./HeroActionCard"
import { MetaOverlay } from "./MetaOverlay"
import type { HeroItem } from "./types"

export function HeroImageCard({
    item,
    widget,
    onOpenItem,
    className,
}: {
    item: HeroItem
    widget: PageWidget
    onOpenItem: (item: HeroItem) => void
    className: string
}) {
    return (
        <HeroActionCard
            item={item}
            onOpenItem={onOpenItem}
            className={`relative block shrink-0 overflow-hidden bg-muted  rounded-lg ${className}`}
        >
            <img
                src={item.image!}
                alt={item.title}
                draggable={false}
                className="h-full w-full object-cover "
            />
            <MetaOverlay item={item} widget={widget} />
        </HeroActionCard>
    )
}