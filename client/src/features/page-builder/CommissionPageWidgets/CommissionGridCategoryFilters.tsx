import { type CommissionCategory } from './types'
import FilterButton from './FilterButton'


export function CommissionGridCategoryFilters({
    categories,
    activeCategory,
    onChange,
}: {
    categories: CommissionCategory[]
    activeCategory: string
    onChange?: (value: string) => void
}) {
    if (categories.length === 0) return null

    return (
        <div className="category-list mb-6">
            <div className="category-rail__inner">
                <FilterButton active={!activeCategory} onClick={() => onChange?.('')}>
                    All types
                </FilterButton>

                {categories.map((category) => (
                    <FilterButton
                        key={category.id}
                        active={activeCategory === category.slug}
                        onClick={() => onChange?.(category.slug)}
                    >
                        {category.name}
                    </FilterButton>
                ))}
            </div>
        </div>
    )
}
