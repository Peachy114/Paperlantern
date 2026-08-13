import { type ReactNode } from 'react'

export default function FilterButton({
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
            data-active={active}
            aria-pressed={active}
            className="category-control border"
        >
            {children}
        </button>
    )
}
