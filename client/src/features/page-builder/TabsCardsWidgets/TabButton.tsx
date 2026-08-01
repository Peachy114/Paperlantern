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
                    ? 'bg-white/80 font-bold text-[var(--foreground)] shadow-sm'
                    : 'font-medium text-[var(--foreground)] hover:bg-white/50'
            }`}
        >
            {children}
        </button>
    )
}
