export default function TabButton({
    active,
    children,
    onClick,
}: {
    active: boolean
    children: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-sm no-underline transition-all duration-200 ${
                active
                    ? 'bg-[var(--comix-filter-selected-background)] font-bold text-[var(--comix-filter-selected-text)] shadow-sm'
                    : 'font-medium text-[var(--comix-filter-nav-text)] hover:bg-[var(--comix-filter-pill-hover-background)]'
            }`}
        >
            {children}
        </button>
    )
}
