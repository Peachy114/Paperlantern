import { useMemo, useState } from 'react'
import type { WorkItem } from '@/features/work/hooks/useHome'
import { useHome } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'

import TabWorkCard from './TabWorkCard'
import TabButton from './TabButton'
import { sortItems, labelOptions, filterItems, uniqueItems } from './tabCard.utils'

export default function TabCardsWidget({
    widget,
    works,
    preview = false,
}: {
    widget: PageWidget
    works?: WorkItem[]
    preview?: boolean
}) {
    const home = useHome({ preview })
    const [activeLabel, setActiveLabel] = useState('all')

    const sourceWorks = useMemo(
        () =>
            works?.length
                ? works
                : [
                      ...home.weeklyChart,
                      ...home.freshReleases,
                      ...home.popularWorks,
                      ...home.topLikedWorks,
                      ...home.todayReleases,
                  ],
        [
            works,
            home.weeklyChart,
            home.freshReleases,
            home.popularWorks,
            home.topLikedWorks,
            home.todayReleases,
        ]
    )

    const items = useMemo(
        () =>
            sortItems(uniqueItems(filterItems(sourceWorks, widget)), widget).slice(
                0,
                widget.settings.limit ?? 12
            ),
        [sourceWorks, widget]
    )

    const labels = useMemo(() => labelOptions(items), [items])

    const visibleItems = useMemo(
        () =>
            activeLabel === 'all'
                ? items
                : items.filter((item) =>
                      (item.genres ?? []).some(
                          (label) => label.toLowerCase() === activeLabel.toLowerCase()
                      )
                  ),
        [activeLabel, items]
    )

    if (items.length === 0) {
        return null
    }

    return (
        <section className="bg-brand-gradient-soft w-full overflow-hidden px-3 py-2 sm:px-4">
            <section className="mx-auto my-8 w-full max-w-[1480px]">
                {/* Filter tabs */}
                <div className="overflow-hidden rounded-[20px] border border-[var(--comix-filter-border)] bg-[var(--comix-filter-background)] shadow-[var(--shadow-xs)]">
                    <div className="flex min-h-14 items-center gap-1 overflow-x-auto px-4 py-3 sm:gap-2">
                        <TabButton
                            active={activeLabel === 'all'}
                            onClick={() => setActiveLabel('all')}
                        >
                            All
                        </TabButton>

                        {labels.map((label) => (
                            <TabButton
                                key={label}
                                active={activeLabel === label}
                                onClick={() => setActiveLabel(label)}
                            >
                                {label}
                            </TabButton>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div className="mt-5 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
                    {visibleItems.map((item, index) => (
                        <TabWorkCard
                            key={`${item.type}-${item.slug || item.id}`}
                            item={item}
                            rank={index + 1}
                            widget={widget}
                        />
                    ))}
                </div>
            </section>
        </section>
    )
}
