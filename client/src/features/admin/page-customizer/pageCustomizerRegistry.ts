import type { PageBoardItem, PageKey, PageWidget } from '@/types/pageLayout'

export type PageRegistryItem = { key: PageKey; label: string }
export type WidgetRegistryItem = { value: string; label: string }

// Page Builder Blocks Registry
export const PAGES: PageRegistryItem[] = [
    { key: 'home', label: 'Homepage' },
    { key: 'comix', label: 'Comix' },
    { key: 'novels', label: 'Novels' },
    { key: 'arts', label: 'Arts' },
    { key: 'commissions', label: 'My Commissions' },
    { key: 'shop', label: 'Shop' },
    { key: 'daily', label: 'Daily' },
    { key: 'rankings', label: 'Rankings' },
    { key: 'genre', label: 'Genre' },
]

const COMMON_WIDGETS: WidgetRegistryItem[] = [
    { value: 'banner', label: 'Banner' },
    { value: 'board', label: 'Board' },
    { value: 'cards', label: 'Cards' },
    { value: 'episodes', label: 'Episodes' },
    { value: 'featured_hero', label: 'Featured Hero' },
    { value: 'grid_con', label: 'Grid Continuation' },
    { value: 'grid_image', label: 'Grid Image' },
    { value: 'group_hero', label: 'Group Hero' },
    { value: 'image', label: 'Image' },
    { value: 'labels', label: 'Labels' },
    { value: 'shop_card', label: 'Shop Card' },
    { value: 'spacer', label: 'Empty Space' },
    { value: 'sticker', label: 'Sticker' },
    { value: 'tab_cards', label: 'Tab with Cards' },
    { value: 'text', label: 'Text' },
    { value: 'top_10s', label: "Top 10's" },
]

const DISCOVERY_WIDGETS: WidgetRegistryItem[] = [
    { value: 'active_discussions', label: 'Active Discussions' },
    { value: 'beginner_manga', label: 'Beginner Manga' },
    { value: 'best_murim', label: 'Best Murim' },
    { value: 'best_novels', label: 'Best Novels' },
    { value: 'christmas_collection', label: 'Christmas Collection' },
    { value: 'coming_soon', label: 'Coming Soon' },
    { value: 'completed_series', label: 'Completed Series' },
    { value: 'content_tabs', label: 'Tabs Menu' },
    { value: 'continue_reading', label: 'Continue Reading' },
    { value: 'editors_picks', label: "Editor's Picks" },
    { value: 'fresh', label: 'Fresh Release' },
    { value: 'halloween_specials', label: 'Halloween Specials' },
    { value: 'hidden_gems', label: 'Hidden Gems' },
    { value: 'highest_rated', label: 'Highest Rated' },
    { value: 'latest_comments', label: 'Latest Comments' },
    { value: 'latest', label: 'Latest Chapters' },
    { value: 'latest_comic_chapters', label: 'Latest Comic Chapters' },
    { value: 'latest_novel_chapters', label: 'Latest Novel Chapters' },
    { value: 'latest_reviews', label: 'Latest Reviews' },
    { value: 'monthly_ranking', label: 'Monthly Ranking' },
    { value: 'most_bookmarked', label: 'Most Bookmarked' },
    { value: 'most_discussed', label: 'Most Discussed' },
    { value: 'most_favorited', label: 'Most Favorited' },
    { value: 'most_followed', label: 'Most Followed' },
    { value: 'most_popular', label: 'Most Popular' },
    { value: 'most_read', label: 'Most Read' },
    { value: 'most_reviewed', label: 'Most Reviewed' },
    { value: 'most_shared', label: 'Most Shared' },
    { value: 'most_viewed', label: 'Most Viewed' },
    { value: 'new_series', label: 'New Series' },
    { value: 'new_uploads', label: 'New Uploads' },
    { value: 'popular', label: 'Popular' },
    { value: 'popular_manga', label: 'Popular Manga' },
    { value: 'popular_manhua', label: 'Popular Manhua' },
    { value: 'popular_manhwa', label: 'Popular Manhwa' },
    { value: 'popular_novels', label: 'Popular Novels' },
    { value: 'random_work', label: 'Random Work' },
    { value: 'reader_favorites', label: 'Reader Favorites' },
    { value: 'recently_added', label: 'Recently Added' },
    { value: 'recently_commented', label: 'Recently Commented' },
    { value: 'recently_updated', label: 'Recently Updated' },
    { value: 'recently_viewed', label: 'Recently Viewed' },
    { value: 'recommended_for_you', label: 'Recommended For You' },
    { value: 'returning_series', label: 'Returning Series' },
    { value: 'similar_series', label: 'Similar Series' },
    { value: 'summer_picks', label: 'Summer Picks' },
    { value: 'today_releases', label: "Today's Releases" },
    { value: 'today_top', label: "Today's Top 10" },
    { value: 'top_liker', label: 'Top Liker' },
    { value: 'top_reviewers', label: 'Top Reviewers' },
    { value: 'top_this_month', label: 'Top This Month' },
    { value: 'top_this_week', label: 'Top This Week' },
    { value: 'top_this_year', label: 'Top This Year' },
    { value: 'trending', label: 'Trending' },
    { value: 'trending_manga', label: 'Trending Manga' },
    { value: 'trending_manhua', label: 'Trending Manhua' },
    { value: 'trending_manhwa', label: 'Trending Manhwa' },
    { value: 'trending_novels', label: 'Trending Novels' },
    { value: 'trending_this_month', label: 'Trending This Month' },
    { value: 'trending_this_week', label: 'Trending This Week' },
    { value: 'trending_today', label: 'Trending Today' },
    { value: 'valentines_romance', label: "Valentine's Romance" },
    { value: 'weekly', label: 'Weekly' },
    { value: 'weekly_cards', label: 'Weekly Cards' },
    { value: 'weekly_hero', label: 'Weekly Hero' },
    { value: 'winter_picks', label: 'Winter Picks' },
]

function uniqueWidgetTypes(items: WidgetRegistryItem[]): WidgetRegistryItem[] {
    const seen = new Set<string>()

    return items.filter((item) => {
        if (seen.has(item.value)) return false
        seen.add(item.value)
        return true
    }).sort((a, b) => a.label.localeCompare(b.label))
}

// add widget types to the registry for each page
export const WIDGET_TYPES: Record<PageKey, WidgetRegistryItem[]> = {
    home: uniqueWidgetTypes([
        { value: 'hero', label: 'Hero' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'episodes', label: 'Episodes' },
        { value: 'announcement_hero', label: 'Announcement Hero' },
        { value: 'announcement_banner', label: 'Announcement Banner' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'today_releases', label: "Today's Releases" },
        { value: 'today_top', label: "Today's Top 10" },
        { value: 'fresh', label: 'Fresh Release' },
        { value: 'latest', label: 'Latest Chapters' },
        { value: 'popular', label: 'Popular' },
        { value: 'top_liker', label: 'Top Liker' },
        ...DISCOVERY_WIDGETS,
        ...COMMON_WIDGETS,
    ]),
    comix: uniqueWidgetTypes([
        { value: 'content_tabs', label: 'Tabs Menu' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'episodes', label: 'Episodes' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'fresh', label: 'Fresh Release' },
        { value: 'latest', label: 'Latest Chapters' },
        { value: 'popular', label: 'Popular' },
        { value: 'top_liker', label: 'Top Liker' },
        ...DISCOVERY_WIDGETS,
        ...COMMON_WIDGETS,
    ]),
    novels: uniqueWidgetTypes([
        { value: 'content_tabs', label: 'Tabs Menu' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'episodes', label: 'Episodes' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'fresh', label: 'Fresh Release' },
        { value: 'latest', label: 'Latest Chapters' },
        { value: 'popular', label: 'Popular' },
        { value: 'top_liker', label: 'Top Liker' },
        ...DISCOVERY_WIDGETS,
        ...COMMON_WIDGETS,
    ]),
    arts: uniqueWidgetTypes([
        { value: 'content_tabs', label: 'Tabs Menu' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'episodes', label: 'Episodes' },
        { value: 'featured_artists', label: 'Featured Artists' },
        { value: 'labels', label: 'Labels' },
        { value: 'arts_grid', label: 'Arts Grid' },
        ...DISCOVERY_WIDGETS,
        ...COMMON_WIDGETS,
    ]),
    commissions: uniqueWidgetTypes([
        { value: 'content_tabs', label: 'Tabs Menu' },
        { value: 'tab_cards', label: 'Tab with Cards' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'commission_grid', label: 'Commission Grid' },
        { value: 'boosted_commissions', label: 'Boosted Commissions' },
        { value: 'featured_artists', label: 'Featured Artists' },
        ...DISCOVERY_WIDGETS,
        ...COMMON_WIDGETS,
    ]),
    shop: uniqueWidgetTypes([
        ...DISCOVERY_WIDGETS,
        { value: 'tab_cards', label: 'Tab with Cards' },
        { value: 'shop_card', label: 'Shop Card' },
        { value: 'sticker_shop', label: 'Sticker Shop' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'labels', label: 'Labels' },
        { value: 'grid_image', label: 'Grid Image' },
        { value: 'grid_con', label: 'Grid Continuation' },
        { value: 'cards', label: 'Cards' },
        { value: 'banner', label: 'Banner' },
        { value: 'text', label: 'Text' },
        { value: 'image', label: 'Image' },
        { value: 'sticker', label: 'Sticker' },
        { value: 'board', label: 'Board' },
        { value: 'spacer', label: 'Empty Space' },
    ]),
    daily: uniqueWidgetTypes([...DISCOVERY_WIDGETS, ...COMMON_WIDGETS]),
    rankings: uniqueWidgetTypes([...DISCOVERY_WIDGETS, ...COMMON_WIDGETS]),
    genre: uniqueWidgetTypes([
        { value: 'content_tabs', label: 'Tabs Menu' },
        { value: 'labels', label: 'Labels' },
        { value: 'featured_hero', label: 'Featured Hero' },
        { value: 'group_hero', label: 'Group Hero' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'popular', label: 'Popular' },
        { value: 'top_liker', label: 'Top Liker' },
        ...COMMON_WIDGETS,
    ]),
}

export const GRID_OPTIONS = ['standard', 'masonry', 'bento', 'magazine', 'gallery', 'carousel']

const CARD_WIDGETS = [
    'active_discussions',
    'beginner_manga',
    'best_murim',
    'best_novels',
    'cards',
    'christmas_collection',
    'coming_soon',
    'completed_series',
    'continue_reading',
    'editors_picks',
    'episodes',
    'fresh',
    'grid_con',
    'grid_image',
    'halloween_specials',
    'hidden_gems',
    'highest_rated',
    'latest',
    'latest_comments',
    'latest_comic_chapters',
    'latest_novel_chapters',
    'latest_reviews',
    'monthly_ranking',
    'most_bookmarked',
    'most_discussed',
    'most_favorited',
    'most_followed',
    'most_popular',
    'most_read',
    'most_reviewed',
    'most_shared',
    'most_viewed',
    'new_series',
    'new_uploads',
    'popular',
    'popular_manga',
    'popular_manhua',
    'popular_manhwa',
    'popular_novels',
    'random_work',
    'reader_favorites',
    'recently_added',
    'recently_commented',
    'recently_updated',
    'recently_viewed',
    'recommended_for_you',
    'returning_series',
    'similar_series',
    'summer_picks',
    'tab_cards',
    'today_releases',
    'today_top',
    'top_10s',
    'top_liker',
    'top_reviewers',
    'top_this_month',
    'top_this_week',
    'top_this_year',
    'trending',
    'trending_manga',
    'trending_manhua',
    'trending_manhwa',
    'trending_novels',
    'trending_this_month',
    'trending_this_week',
    'trending_today',
    'valentines_romance',
    'weekly',
    'weekly_cards',
    'weekly_hero',
    'winter_picks',
]

const HERO_WIDGETS = ['featured_hero', 'group_hero', 'weekly_hero']

function isCardWidget(type: string) {
    return CARD_WIDGETS.includes(type)
}

function isHeroWidget(type: string) {
    return HERO_WIDGETS.includes(type)
}

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
        title:
            type === 'group_hero'
                ? 'Popular Arts'
                : type === 'sticker_shop'
                  ? 'Sticker Shop'
                : type === 'shop_card'
                  ? 'Shop Picks'
                  : type === 'tab_cards'
                    ? 'Browse'
                    : title,
        enabled: true,
        settings: {
            grid: 'masonry',
            filter: 'all',
            card_show_new: ['shop_card', 'sticker_shop', 'cards', 'grid_image', 'grid_con', 'top_10s', 'tab_cards', 'episodes'].includes(type)
                ? true
                : undefined,
            card_show_popular: ['shop_card', 'sticker_shop', 'cards', 'grid_image', 'grid_con', 'top_10s', 'tab_cards', 'episodes'].includes(type)
                ? true
                : undefined,
            card_show_rating: ['shop_card', 'cards', 'tab_cards'].includes(type) || isCardWidget(type) ? true : undefined,
            card_show_name: ['shop_card', 'sticker_shop', 'cards', 'grid_image', 'grid_con', 'top_10s', 'tab_cards', 'episodes'].includes(type) || isCardWidget(type)
                ? true
                : undefined,
            card_show_artist: ['shop_card', 'sticker_shop', 'cards', 'tab_cards'].includes(type) ? true : undefined,
            card_show_sold: ['shop_card', 'sticker_shop', 'tab_cards'].includes(type) ? true : undefined,
            card_show_views: ['cards', 'grid_image', 'grid_con', 'tab_cards', 'episodes'].includes(type) || isCardWidget(type) ? true : undefined,
            card_show_likes: ['shop_card', 'cards', 'grid_image', 'grid_con', 'tab_cards', 'episodes'].includes(type) || isCardWidget(type)
                ? true
                : undefined,
            card_show_status: ['cards', 'grid_image', 'grid_con', 'tab_cards'].includes(type) || isCardWidget(type)
                ? true
                : undefined,
            card_show_genres: ['cards', 'grid_image', 'grid_con', 'tab_cards', 'episodes'].includes(type) || isCardWidget(type)
                ? true
                : undefined,
            card_show_type: ['cards', 'grid_image', 'grid_con', 'tab_cards'].includes(type) || isCardWidget(type)
                ? true
                : undefined,
            card_show_rank: ['shop_card', 'sticker_shop', 'top_10s', 'tab_cards'].includes(type) || isCardWidget(type) ? true : undefined,
            card_show_labels: ['shop_card', 'sticker_shop', 'cards', 'tab_cards'].includes(type) ? true : undefined,
            card_show_price: ['shop_card', 'sticker_shop', 'tab_cards'].includes(type) ? true : undefined,
            labels_display: type === 'labels' ? 'labels' : undefined,
            date_mode: isCardWidget(type) || isHeroWidget(type) ? 'all' : undefined,
            daily_date: undefined,
            continue_from_previous: ['labels', 'grid_con'].includes(type) ? type === 'grid_con' : undefined,
            show_continuation_badge: type === 'labels' ? true : undefined,
            label_background_color: type === 'labels' ? '#ff8a00' : undefined,
            label_text_color: type === 'labels' ? '#ffffff' : undefined,
            label_active_background_color: type === 'labels' ? '#56b6ff' : undefined,
            label_active_text_color: type === 'labels' ? '#ffffff' : undefined,
            group_hero_design: type === 'group_hero' ? 'popular_arts' : undefined,
            group_source_arts: type === 'group_hero' ? true : undefined,
            group_source_comix: type === 'group_hero' ? false : undefined,
            group_source_novels: type === 'group_hero' ? false : undefined,
            group_source_commissions: type === 'group_hero' ? false : undefined,
            group_sort: type === 'group_hero' ? 'popular' : undefined,
            group_view_all_enabled: type === 'group_hero' ? true : undefined,
            group_view_all_sort: type === 'group_hero' ? 'popular' : undefined,
            hero_source_arts: isHeroWidget(type) ? true : undefined,
            hero_source_announcements: isHeroWidget(type) ? true : undefined,
            hero_source_works: isHeroWidget(type) ? true : undefined,
            hero_source_novels: isHeroWidget(type) ? true : undefined,
            hero_source_commissions: isHeroWidget(type) ? false : undefined,
            hero_source_shop: isHeroWidget(type) ? false : undefined,
            text: type === 'banner' ? 'Add a short banner message here.' : type === 'group_hero' ? 'Artwork for this week' : undefined,
            tabs_show_main: type === 'content_tabs' ? true : undefined,
            tabs_show_comix: type === 'content_tabs' ? true : undefined,
            tabs_show_novels: type === 'content_tabs' ? true : undefined,
            tabs_show_arts: type === 'content_tabs' ? true : undefined,
            tabs_show_commissions: type === 'content_tabs' ? false : undefined,
            tabs_show_shop: type === 'tab_cards' ? true : undefined,
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
                    : type === 'banner'
                      ? 960
                    : type === 'spacer'
                      ? 720
                      : type === 'board'
                        ? 960
                        : undefined,
            content_height: type === 'spacer' ? 120 : type === 'board' ? 420 : type === 'banner' ? 260 : undefined,
            font_size: type === 'text' || type === 'banner' ? 14 : undefined,
            text_align: type === 'text' || type === 'banner' ? 'start' : undefined,
        },
    }
}
