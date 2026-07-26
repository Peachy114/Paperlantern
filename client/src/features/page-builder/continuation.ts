import type { PageWidget } from '@/types/pageLayout'

export function labelContinuationOffset(widgets: PageWidget[], widget: PageWidget) {
    if (!widget.settings.continue_from_previous) return 0

    return previousEnabledWidgets(widgets, widget)
        .filter((item) => item.type === 'labels')
        .reduce((total, item) => total + (item.settings.limit ?? 99), 0)
}

export function gridContinuationOffset(widgets: PageWidget[], widget: PageWidget) {
    if (!widget.settings.continue_from_previous && widget.type !== 'grid_con') return 0

    return previousEnabledWidgets(widgets, widget)
        .filter((item) => isGridSequenceWidget(item.type))
        .reduce((total, item) => total + (item.settings.limit ?? 10), 0)
}

export function isGridSequenceWidget(type: string) {
    return [
        'grid_image',
        'grid_con',
        'cards',
        'popular',
        'top_liker',
        'weekly',
        'fresh',
        'daily',
        'today_releases',
        'today_top',
        'top_10s',
        'arts_grid',
        'commission_grid',
        'boosted_commissions',
    ].includes(type)
}

function previousEnabledWidgets(widgets: PageWidget[], widget: PageWidget) {
    const index = widgets.findIndex((item) => item.id === widget.id)
    if (index <= 0) return []

    return widgets.slice(0, index).filter((item) => item.enabled)
}
