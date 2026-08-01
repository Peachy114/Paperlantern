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