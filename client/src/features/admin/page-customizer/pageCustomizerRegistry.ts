import type { PageBoardItem, PageKey, PageWidget } from '@/types/pageLayout'

export type PageRegistryItem = { key: PageKey; label: string }
export type WidgetRegistryItem = { value: string; label: string }

// Page Builder Blocks Registry
export const PAGES: PageRegistryItem[] = [
    { key: 'home', label: 'Homepage' },
    { key: 'comix', label: 'Comix' },
    { key: 'arts', label: 'Arts' },
    { key: 'commissions', label: 'My Commissions' },
    { key: 'daily', label: 'Daily' },
    { key: 'rankings', label: 'Rankings' },
    { key: 'genre', label: 'Genre' },
]

const COMMON_WIDGETS: WidgetRegistryItem[] = [
    { value: 'featured_hero', label: 'Featured Hero' },
    { value: 'group_hero', label: 'Group Hero' },
    { value: 'grid_image', label: 'Grid Image' },
    { value: 'cards', label: 'Cards' },
    { value: 'shop_card', label: 'Shop Card' },
    { value: 'top_10s', label: "Top 10's" },
    { value: 'labels', label: 'Labels' },
    { value: 'text', label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'sticker', label: 'Sticker' },
    { value: 'board', label: 'Board' },
    { value: 'spacer', label: 'Empty Space' },
]

const DISCOVERY_WIDGETS: WidgetRegistryItem[] = [
    { value: 'content_tabs', label: 'Tabs Menu' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'today_releases', label: "Today's Releases" },
    { value: 'today_top', label: "Today's Top 10" },
    { value: 'fresh', label: 'Fresh Release' },
    { value: 'latest', label: 'Latest Chapters' },
    { value: 'popular', label: 'Popular' },
    { value: 'top_liker', label: 'Top Liker' },
]

// add widget types to the registry for each page
export const WIDGET_TYPES: Record<PageKey, WidgetRegistryItem[]> = {
    home: [
        { value: 'hero', label: 'Hero' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'announcement_hero', label: 'Announcement Hero' },
        { value: 'announcement_banner', label: 'Announcement Banner' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'today_releases', label: "Today's Releases" },
        { value: 'today_top', label: "Today's Top 10" },
        { value: 'fresh', label: 'Fresh Release' },
        { value: 'latest', label: 'Latest Chapters' },
        { value: 'popular', label: 'Popular' },
        { value: 'top_liker', label: 'Top Liker' },
        ...COMMON_WIDGETS,
    ],
    comix: [
        { value: 'content_tabs', label: 'Tabs Menu' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'fresh', label: 'Fresh Release' },
        { value: 'latest', label: 'Latest Chapters' },
        { value: 'popular', label: 'Popular' },
        { value: 'top_liker', label: 'Top Liker' },
        ...COMMON_WIDGETS,
    ],
    arts: [
        { value: 'content_tabs', label: 'Tabs Menu' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'featured_artists', label: 'Featured Artists' },
        { value: 'labels', label: 'Labels' },
        { value: 'arts_grid', label: 'Arts Grid' },
        ...COMMON_WIDGETS,
    ],
    commissions: [
        { value: 'content_tabs', label: 'Tabs Menu' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'commission_grid', label: 'Commission Grid' },
        { value: 'boosted_commissions', label: 'Boosted Commissions' },
        { value: 'featured_artists', label: 'Featured Artists' },
        ...COMMON_WIDGETS,
    ],
    daily: [...DISCOVERY_WIDGETS, ...COMMON_WIDGETS],
    rankings: [...DISCOVERY_WIDGETS, ...COMMON_WIDGETS],
    genre: [
        { value: 'content_tabs', label: 'Tabs Menu' },
        { value: 'labels', label: 'Labels' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'popular', label: 'Popular' },
        { value: 'top_liker', label: 'Top Liker' },
        ...COMMON_WIDGETS,
    ],
}

export const GRID_OPTIONS = ['standard', 'masonry', 'bento', 'magazine', 'gallery', 'carousel']

export function createBoardItem(type: PageBoardItem['type'], index: number): PageBoardItem {
    return {
        id: crypto.randomUUID(),
        type,
        x: 5 + (index % 4) * 8,
        y: 40 + index * 12,
        w: type === 'text' ? 36 : 18,
        h: type === 'text' ? 120 : 160,
        text: type === 'text' ? 'Board text' : '',
        style: {
            transparent: true,
            border: false,
            radius: 0,
            padding_block: 0,
            padding_inline: 0,
            font_size: type === 'text' ? 16 : undefined,
            text_align: type === 'text' ? 'start' : undefined,
            z_index: index + 1,
            rotate: 0,
        },
    }
}

export function createWidget(type: string, title: string, index: number): PageWidget {
    return {
        id: crypto.randomUUID(),
        type,
        title: type === 'group_hero' ? 'Popular Arts' : type === 'shop_card' ? 'Shop Picks' : title,
        enabled: true,
        settings: {
            text: type === 'group_hero' ? 'Artwork for this week' : undefined,
            grid: 'masonry',
            filter: 'all',
            card_show_new: ['shop_card', 'cards', 'grid_image', 'top_10s'].includes(type)
                ? true
                : undefined,
            card_show_popular: ['shop_card', 'cards', 'grid_image', 'top_10s'].includes(type)
                ? true
                : undefined,
            card_show_rating: ['shop_card', 'cards'].includes(type) ? true : undefined,
            card_show_name: ['shop_card', 'cards', 'grid_image', 'top_10s'].includes(type)
                ? true
                : undefined,
            card_show_artist: ['shop_card', 'cards'].includes(type) ? true : undefined,
            card_show_sold: type === 'shop_card' ? true : undefined,
            card_show_views: ['cards', 'grid_image'].includes(type) ? true : undefined,
            card_show_likes: ['shop_card', 'cards', 'grid_image'].includes(type)
                ? true
                : undefined,
            card_show_rank: ['shop_card', 'top_10s'].includes(type) ? true : undefined,
            card_show_labels: ['shop_card', 'cards'].includes(type) ? true : undefined,
            card_show_price: type === 'shop_card' ? true : undefined,
            group_hero_design: type === 'group_hero' ? 'popular_arts' : undefined,
            group_source_arts: type === 'group_hero' ? true : undefined,
            group_source_comix: type === 'group_hero' ? false : undefined,
            group_source_novels: type === 'group_hero' ? false : undefined,
            group_source_commissions: type === 'group_hero' ? false : undefined,
            group_sort: type === 'group_hero' ? 'popular' : undefined,
            group_view_all_enabled: type === 'group_hero' ? true : undefined,
            group_view_all_sort: type === 'group_hero' ? 'popular' : undefined,
            tabs_show_main: type === 'content_tabs' ? true : undefined,
            tabs_show_comix: type === 'content_tabs' ? true : undefined,
            tabs_show_novels: type === 'content_tabs' ? true : undefined,
            tabs_show_arts: type === 'content_tabs' ? true : undefined,
            tabs_show_commissions: type === 'content_tabs' ? false : undefined,
            layout: 'horizontal',
            align: 'auto',
            display: 'block',
            columns: undefined,
            info_layout: ['arts_grid', 'commission_grid', 'boosted_commissions'].includes(type)
                ? 'image_only'
                : 'image_title_description',
            placement: type === 'sticker' ? 'tight' : undefined,
            metric: 'views',
            limit: 10,
            allow_overlap: false,
            board_items: type === 'board' ? [] : undefined,
        },
        style: {
            transparent: true,
            border: false,
            radius: 0,
            padding: 0,
            padding_block: 0,
            padding_inline: 0,
            margin: 0,
            margin_block: 0,
            margin_inline: 0,
            offset_x: 0,
            offset_y: 0,
            z_index: index + 1,
            rotate: 0,
            sticker_size: type === 'sticker' ? 180 : undefined,
            content_width:
                type === 'text'
                    ? 720
                    : type === 'spacer'
                      ? 720
                      : type === 'board'
                        ? 960
                        : undefined,
            content_height: type === 'spacer' ? 120 : type === 'board' ? 420 : undefined,
            font_size: type === 'text' ? 14 : undefined,
            text_align: type === 'text' ? 'start' : undefined,
        },
    }
}
