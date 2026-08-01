import type { CSSProperties, ReactNode } from "react"
import { Link } from 'react-router-dom'
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
    if (item.type === 'announcement') {
        return (
            <button
                type="button"
                draggable={false}
                onClick={() => onOpenItem(item)}
                className={`${className} text-left`}
                style={style}
            >
                {children}
            </button>
        )
    }

    return (
        <Link to={item.href} draggable={false} className={className} style={style}>
            {children}
        </Link>
    )
}