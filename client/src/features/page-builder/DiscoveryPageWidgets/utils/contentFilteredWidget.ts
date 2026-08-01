import type { PageWidget } from '@/types/pageLayout'

export function contentFilteredWidget(widget: PageWidget, filter: string): PageWidget {
    if (filter === 'all') return widget

    return {
        ...widget,
        settings: {
            ...widget.settings,
            hero_source_arts: filter === 'art',
            hero_source_works: filter === 'webtoon',
            hero_source_novels: filter === 'wattpad',
            hero_source_commissions: filter === 'commission',
            hero_source_announcements: false,
            hero_source_shop: false,
            group_source_arts: filter === 'art',
            group_source_comix: filter === 'webtoon',
            group_source_novels: filter === 'wattpad',
            group_source_commissions: filter === 'commission',
        },
    }
}