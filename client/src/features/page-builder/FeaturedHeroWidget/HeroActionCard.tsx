import type { CSSProperties, ReactNode } from "react"
import type { HeroItem } from "./types"


export function HeroActionCard({
    item,
    onOpenItem,
    className,
    style,
    children,
}: {
    item: HeroItem
    onOpenItem: (item: HeroItem) => void
    className: string
    style?: CSSProperties
    children: ReactNode
}) {
    return (
        <button
            type="button"
            draggable={false}
            onClick={() => onOpenItem(item)}
            className={`${className} cursor-pointer text-left`}
            style={style}
        >
            {children}
        </button>
    )
}
