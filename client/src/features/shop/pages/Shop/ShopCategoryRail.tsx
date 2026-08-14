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
        <div className="category-rail mb-5">
            <div className="category-rail__inner">
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
