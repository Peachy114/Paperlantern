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
        <div className="mb-6 flex flex-wrap gap-2">
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
    )
}