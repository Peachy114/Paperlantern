export type PageKey = 'home' | 'comix' | 'arts' | 'commissions' | 'daily' | 'rankings' | 'genre'

export type PageBoardItemType = 'sticker' | 'image' | 'text'

export interface PageBoardItem {
    id: string
    type: PageBoardItemType
    x: number
    y: number
    w: number
    h: number
    text?: string
    asset_path?: string
    sticker_id?: string
    sticker_image_path?: string
    font_url?: string
    style?: PageWidgetStyle
}

export interface PageWidgetSettings {
    text?: string
    asset_path?: string
    sticker_id?: string
    sticker_image_path?: string
    font_url?: string
    grid?: 'standard' | 'masonry' | 'bento' | 'magazine' | 'gallery' | 'carousel'
    filter?: 'all' | 'webtoon' | 'novel' | 'art'
    layout?: 'horizontal' | 'vertical' | 'compact' | 'row' | 'column'
    align?: 'auto' | 'start' | 'center' | 'end' | 'stretch' | 'justify'
    display?: 'block' | 'inline'
    columns?: number
    info_layout?:
        | 'image_only'
        | 'image_title'
        | 'image_title_inline'
        | 'title_image'
        | 'image_title_description'
    placement?: 'tight' | 'overlay'
    anchor_widget_id?: string | null
    metric?: 'views' | 'likes'
    limit?: number
    allow_overlap?: boolean
    hero_design?: 'default' | 'reference_1' | 'reference_2' | 'reference_3' | 'reference_4'
    hero_show_name?: boolean
    hero_show_artist?: boolean
    hero_show_views?: boolean
    hero_show_likes?: boolean
    hero_show_favorite?: boolean
    hero_label_style?: 'badges' | 'plain'
    hero_source_arts?: boolean
    hero_source_announcements?: boolean
    hero_source_works?: boolean
    hero_source_commissions?: boolean
    hero_featured_only?: boolean
    group_hero_design?: 'default' | 'popular_arts' | 'spotlight_stack'
    group_source_arts?: boolean
    group_source_comix?: boolean
    group_source_novels?: boolean
    group_source_commissions?: boolean
    group_sort?: 'popular' | 'latest' | 'likes' | 'views' | 'featured'
    group_filter_labels?: string
    group_view_all_enabled?: boolean
    group_view_all_sort?: 'popular' | 'latest' | 'likes' | 'views' | 'featured'
    tabs_show_main?: boolean
    tabs_show_comix?: boolean
    tabs_show_novels?: boolean
    tabs_show_arts?: boolean
    tabs_show_commissions?: boolean
    selected_board_item_id?: string
    board_items?: PageBoardItem[]
}

export interface PageWidgetStyle {
    background?: string
    text_color?: string
    border_color?: string
    font_family?: string
    transparent?: boolean
    border?: boolean
    radius?: number
    padding?: number
    padding_block?: number
    padding_inline?: number
    margin?: number
    margin_block?: number
    margin_inline?: number
    offset_x?: number
    offset_y?: number
    offset_x_percent?: number | null
    offset_y_percent?: number | null
    z_index?: number
    rotate?: number
    sticker_size?: number
    content_width?: number
    content_height?: number
    font_size?: number
    text_align?: 'start' | 'center' | 'end'
}

export interface PageWidget {
    id: string
    type: string
    title: string
    enabled: boolean
    settings: PageWidgetSettings
    style: PageWidgetStyle
    sort_order?: number
}

export interface PageLayout {
    page_key: PageKey
    widgets: PageWidget[]
    is_default: boolean
}
