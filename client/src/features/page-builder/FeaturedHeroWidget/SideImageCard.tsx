import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { HeroItem } from "./types"

export function SideImageCard({
    item,
    onClick,
    className,
    side,
}: {
    item: HeroItem
    onClick: () => void
    className: string
    side: 'left' | 'right'
}) {
    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.stopPropagation()
    }

    const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
    }

    const borderClass = side === 'left' ? 'rounded-e-lg' : 'rounded-s-lg'
    return (
        <button
            type="button"
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            className={`overflow-hidden bg-muted transition duration-300 blur-[2px]  ${borderClass} ${className}`}
            aria-label={`Show ${item.title}`}
        >
            <img
                src={item.image!}
                alt=""
                draggable={false}
                className="h-full w-full object-cover "
            />
        </button>
    )
}