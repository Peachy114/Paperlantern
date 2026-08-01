import { ShopCategoryButton } from "./ShopCategoryButton"

export function ShopCategoryRail({
    categories,
    active,
    onChange,
}: {
    categories: string[]
    active: string
    onChange: (value: string) => void
}) {
    if (categories.length === 0) return null

    return (
        <div className="mb-5 overflow-hidden rounded-2xl border bg-background/95 shadow-sm">
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
                <ShopCategoryButton active={active === 'all'} onClick={() => onChange('all')}>
                    All category
                </ShopCategoryButton>
                {categories.map((category) => (
                    <ShopCategoryButton
                        key={category}
                        active={active === category}
                        onClick={() => onChange(category)}
                    >
                        {category}
                    </ShopCategoryButton>
                ))}
            </div>
        </div>
    )
}