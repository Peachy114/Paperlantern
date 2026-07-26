import { useMemo, useState } from 'react'
import type { WorkItem } from '@/features/work/hooks/useHome'
import { useHome } from '@/features/work/hooks/useHome'
import { storageUrl } from '@/utils/storage'
import type { PageWidget } from '@/types/pageLayout'
import WorkCard3 from '@/features/work/components/ui/WorkCard3'

type TabCardItem = WorkItem & { type: 'webtoon' | 'wattpad' | 'art' }

export default function TabCardsWidget({
    widget,
    works,
}: {
    widget: PageWidget
    works?: WorkItem[]
}) {
    const home = useHome()
    const [activeLabel, setActiveLabel] = useState('all')
    const sourceWorks = works?.length
        ? works
        : [
              ...home.weeklyChart,
              ...home.freshReleases,
              ...home.popularWorks,
              ...home.topLikedWorks,
              ...home.todayReleases,
          ]

    const items = useMemo(
        () => sortItems(filterItems(sourceWorks, widget), widget).slice(0, widget.settings.limit ?? 12),
        [sourceWorks, widget]
    )
    const labels = useMemo(() => labelOptions(items), [items])
    const visibleItems =
        activeLabel === 'all'
            ? items
            : items.filter((item) =>
                  (item.genres ?? []).some(
                      (label) => label.toLowerCase() === activeLabel.toLowerCase()
                  )
              )

    if (items.length === 0) return null

    return (
        <section className="mx-auto mt-8 w-full max-w-[1360px] px-5">
            <div className="overflow-hidden rounded-[20px] border border-[var(--comix-filter-border)] bg-[var(--comix-filter-background)] shadow-[var(--shadow-xs)]">
                <div className="flex min-h-14 items-center gap-1 overflow-x-auto px-4 py-3 sm:gap-2">
                    <TabButton active={activeLabel === 'all'} onClick={() => setActiveLabel('all')}>
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

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {visibleItems.map((item, index) => (
                    <WorkCard3
                        key={item.id}
                        id={item.id}
                        slug={item.slug}
                        title={item.title}
                        cover={imageFor(item)}
                        type={item.type === 'wattpad' ? 'novel' : item.type}
                        genres={item.genres}
                        status={item.status}
                        likes={item.likes}
                        views={item.views}
                        rank={widget.settings.card_show_rank !== false ? index + 1 : undefined}
                        showStats={widget.settings.card_show_views !== false || widget.settings.card_show_likes !== false}
                        showTitle={widget.settings.card_show_name !== false}
                        showViews={widget.settings.card_show_views !== false}
                        showLikes={widget.settings.card_show_likes !== false}
                        showStatus={widget.settings.card_show_status !== false}
                        showGenres={widget.settings.card_show_genres !== false}
                        showType={widget.settings.card_show_type !== false}
                        showRank={widget.settings.card_show_rank !== false}
                        boostedUntil={item.boosted_until}
                    />
                ))}
            </div>
        </section>
    )
}

function TabButton({
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
            className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3.5 text-sm no-underline whitespace-nowrap transition-all duration-200 ${
                active
                    ? 'bg-white/80 font-bold text-[var(--foreground)] shadow-sm'
                    : 'font-medium text-[var(--foreground)] hover:bg-white/50'
            }`}
        >
            {children}
        </button>
    )
}

function filterItems(works: WorkItem[], widget: PageWidget): TabCardItem[] {
    const source = widget.settings.filter_cards_data ?? 'mixed'
    const dailyDate = widget.settings.daily_date

    return works
        .filter((work) => work.type !== 'commission')
        .filter((work) => !dailyDate || isSameDate(work.created_at, dailyDate))
        .filter((work) => {
            if (source === 'mixed') return true
            if (source === 'comix') return work.type === 'webtoon'
            if (source === 'novels') return work.type === 'wattpad'
            if (source === 'arts') return work.type === 'art'
            return true
        }) as TabCardItem[]
}

function sortItems(items: TabCardItem[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...items].sort((a, b) => {
        for (const sort of sorts) {
            const result = compareBySort(a, b, sort)
            if (result !== 0) return result
        }

        return 0
    })
}

function compareBySort(a: TabCardItem, b: TabCardItem, sort: string) {
    if (sort === 'featured') return Number(b.is_featured) - Number(a.is_featured)
    if (sort === 'likes') return (b.likes ?? 0) - (a.likes ?? 0)
    if (sort === 'views' || sort === 'popular') return (b.views ?? 0) - (a.views ?? 0)
    if (sort === 'new' || sort === 'latest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    }
    return 0
}

function labelOptions(items: TabCardItem[]) {
    const counts = new Map<string, number>()
    items.forEach((item) => {
        ;(item.genres ?? []).forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1))
    })

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 16)
        .map(([label]) => label)
}

function imageFor(item: TabCardItem) {
    return item.cover ? storageUrl(item.cover, item.type === 'art' ? undefined : 'sm') : null
}

function isSameDate(value: string | undefined, date: string) {
    if (!value || !date) return false
    return value.slice(0, 10) === date
}
