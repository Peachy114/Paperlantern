import type { PageWidget } from '@/types/pageLayout'
import { HeroActionCard } from './HeroActionCard'
import { MetaOverlay } from './MetaOverlay'
import type { HeroItem } from './types'

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
            className={`relative block shrink-0 overflow-hidden rounded-lg bg-zinc-950 ${className}`}
        >
            <img
                src={item.image!}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
            />
            <div className="absolute inset-0 bg-black/20" />
            <img
                src={item.image!}
                alt={item.title}
                draggable={false}
                className="relative z-[1] h-full w-full object-contain"
            />
            <MetaOverlay item={item} widget={widget} />
        </HeroActionCard>
    )
}
