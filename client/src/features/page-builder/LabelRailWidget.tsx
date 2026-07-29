import type { PageWidget } from '@/types/pageLayout'
import { cssColor } from './PageWidgetFrame'

export type LabelRailItem = {
    label: string
    count?: number
}

export default function LabelRailWidget({
    widget,
    labels,
    activeLabel = '',
    offset = 0,
    onSelect,
}: {
    widget: PageWidget
    labels: LabelRailItem[]
    activeLabel?: string
    offset?: number
    onSelect?: (label: string) => void
}) {
    if (labels.length === 0) return null

    const settings = widget.settings ?? {}
    const limit = Math.max(1, settings.limit ?? 99)
    const start = Math.max(0, offset)
    const visible = labels.slice(start, start + limit)
    const hasMore = labels.length > start + visible.length
    const showMore = settings.show_continuation_badge !== false && hasMore

    if (visible.length === 0 && !showMore) return null

    const normalBackground = cssColor(settings.label_background_color) ?? '#ff8a00'
    const normalText = cssColor(settings.label_text_color) ?? '#ffffff'
    const activeBackground = cssColor(settings.label_active_background_color) ?? '#56b6ff'
    const activeText = cssColor(settings.label_active_text_color) ?? '#ffffff'

    return (
        <section className="mx-auto w-full max-w-[1480px] px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
                {visible.map((item) => {
                    const active = activeLabel === item.label
                    const content = item.count ? `${item.label} ${item.count}` : item.label

                    return (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => onSelect?.(item.label)}
                            className="min-h-7 rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm transition hover:brightness-95"
                            style={{
                                background: active ? activeBackground : normalBackground,
                                color: active ? activeText : normalText,
                            }}
                        >
                            {content}
                        </button>
                    )
                })}

                {showMore && (
                    <span
                        className="inline-flex min-h-7 items-center rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm"
                        style={{ background: activeBackground, color: activeText }}
                    >
                        {limit}+
                    </span>
                )}
            </div>
        </section>
    )
}
