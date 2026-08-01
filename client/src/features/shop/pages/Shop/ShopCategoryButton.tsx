export function ShopCategoryButton({
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
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition ${
                active ? 'bg-background text-foreground shadow' : 'text-foreground hover:bg-muted'
            }`}
        >
            {children}
        </button>
    )
}