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
            data-active={active}
            aria-pressed={active}
            className="category-control"
        >
            {children}
        </button>
    )
}
