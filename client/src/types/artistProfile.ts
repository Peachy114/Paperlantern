import type { Art, ArtImage } from '@/types/art'
import type { FeedPost } from '@/api/feeds'

export type ProfileBlockType = 'image' | 'text'
export type ProfileBlockWidth = 'small' | 'medium' | 'large' | 'full'
export type ProfileBlockHeight = 'auto' | 'short' | 'medium' | 'tall'

export interface ArtistProfileUser {
    id: string
    name: string
    username: string
    role: 'super_admin' | 'storyteller' | 'wanderer'
    artist_verified: boolean
    avatar: string | null
    profile_cover: string | null
    profile_cover_position_x: number
    profile_cover_position_y: number
    avatar_position_x: number
    avatar_position_y: number
    artist_title: string | null
    show_public_links: boolean
    profile_background_color: string | null
    profile_background_gradient_from: string | null
    profile_background_gradient_to: string | null
    profile_background_gradient_direction: string
    profile_background_image: string | null
    profile_background_blur: number
    profile_banner_height: number
    profile_avatar_frame_x: number
    profile_avatar_frame_y: number
    profile_avatar_border_width: number
    profile_avatar_border_color: string | null
    profile_avatar_border_radius: number
    profile_nav_layout: 'together' | 'separate'
    profile_nav_x: number
    profile_nav_y: number
    profile_nav_w: number
    profile_nav_h: number
    profile_board_min_height: number
    profile_arts_tile_width: number
    profile_sticker_size: number
    profile_show_cover: boolean
    profile_cover_width: number
    profile_background_has_gradient: boolean
    profile_tabs_config: ProfileTabsConfig
    profile_links: ProfileLink[]
    profile_border_id: string | null
    profile_border: ProfileBorder | null
    bio: string | null
    twitter_url: string | null
    instagram_url: string | null
    tiktok_url: string | null
    followers_count?: number
}

export type ProfileTabId = 'board' | 'arts' | 'works' | 'stickers' | 'comments' | 'feeds'

export type ProfileSectionMode =
    | 'separate_pages'
    | 'board_arts'
    | 'board_stickers'
    | 'board_arts_stickers'

export interface ProfileTabPosition {
    x: number
    y: number
    w: number
    h: number
}

export type ProfileCanvasItemKind = 'tab' | 'section'

export interface ProfileCanvasItem {
    id: string
    type: ProfileTabId
    kind: ProfileCanvasItemKind
    page?: ProfileTabId
    display?:
        | 'grid'
        | 'standard'
        | 'masonry'
        | 'pinterest'
        | 'instagram'
        | 'bento'
        | 'magazine'
        | 'gallery'
        | 'carousel'
        | 'row'
        | 'image'
        | 'image_title'
        | 'split_card'
        | 'table'
        | 'cards'
        | 'compact'
    pagination?: boolean
    locked?: boolean
    sort?: string
    filter?: string
    filters?: string[]
    x: number
    y: number
    w: number
    h: number
}

export interface ProfileTabsConfig {
    visibility: Record<ProfileTabId, boolean>
    section_mode: ProfileSectionMode
    positions: Record<ProfileTabId, ProfileTabPosition>
    buttons?: ProfileCanvasItem[]
    sections?: ProfileCanvasItem[]
    cover_offset?: {
        x: number
        y: number
    }
    border_offset?: {
        x: number
        y: number
    }
    border_scale?: number
    border_width?: number
    border_height?: number
    border_layer?: 'front' | 'back'
    nav_locked?: boolean
    header_locks?: {
        cover_frame: boolean
        avatar_frame: boolean
        avatar_border: boolean
    }
    global_styles?: {
        font_family: string
        text_color: string
        muted_text_color: string
        accent_color: string
        base_font_size: number
        widget_font_size: number
        button_font_size: number
    }
}

export interface ProfileLink {
    id: string
    title: string
    url: string
    image_path?: string | null
    is_public: boolean
}

export interface ProfileBorder {
    id: string
    user_id: string | null
    name: string
    description?: string | null
    image_path: string
    is_default: boolean
    is_public?: boolean
    is_free?: boolean
    credit_cost?: number
    purchase_cost?: number
    subscription_free?: boolean
    gifted?: boolean
    owned?: boolean
    can_use?: boolean
    published_at?: string | null
    owner?: {
        id: string
        name: string
        username: string
        avatar: string | null
        role?: string
    } | null
    sort_order: number
    created_at: string
    updated_at: string
}

export type RoyaltyDesignType =
    | 'message_design'
    | 'message_background'
    | 'comment_border'
    | 'board_button'

export interface RoyaltyDesignAsset {
    id: string
    user_id?: string | null
    type: RoyaltyDesignType
    name: string
    description?: string | null
    image_path: string | null
    style_settings?: {
        design_source?: 'simple' | 'image' | 'gif'
        simple_theme?: 'classic' | 'comic' | 'glass' | 'pixel' | 'svg' | 'image_card'
        simple_tail?: 'straight' | 'curve' | 'none'
        simple_accent?: string
        simple_received_bg?: string
        simple_sent_bg?: string
        simple_border_width?: number
        simple_border_color?: string
        simple_radius?: number
        simple_bg_mode?: 'color' | 'image'
        simple_bg_image?: string
        simple_bg_fit?: 'cover' | 'contain' | 'stretch'
        simple_background?: string
        font_url?: string
        text_transform?: 'none' | 'uppercase' | 'lowercase'
        design_mode?: 'slice' | 'custom'
        sample_text?: string
        font_family?: string
        font_size?: number
        font_weight?: 'normal' | 'medium' | 'bold'
        font_style?: 'normal' | 'italic'
        text_align?: 'left' | 'center' | 'right'
        content_align_y?: 'start' | 'center' | 'end'
        content_layer?: number
        name_layer?: number
        text_layer?: number
        text_name_combined_layer?: boolean
        preview_width?: number
        preview_height?: number
        fit_mode?: 'cover' | 'stretch' | 'stay'
        position_x?: number
        position_y?: number
        move_x?: number
        move_y?: number
        slice_top?: number
        slice_right?: number
        slice_bottom?: number
        slice_left?: number
        clip_to_parent?: boolean
        trim_transparent_padding?: boolean
        custom_parts?: {
            top_left?: boolean | RoyaltyDesignPiece
            top?: boolean | RoyaltyDesignPiece
            top_right?: boolean | RoyaltyDesignPiece
            left?: boolean | RoyaltyDesignPiece
            center?: boolean | RoyaltyDesignPiece
            right?: boolean | RoyaltyDesignPiece
            bottom_left?: boolean | RoyaltyDesignPiece
            bottom?: boolean | RoyaltyDesignPiece
            bottom_right?: boolean | RoyaltyDesignPiece
        }
        custom_extra_pieces?: RoyaltyDesignPiece[]
        image_layers?: RoyaltyDesignImageLayer[]
    } | null
    is_active: boolean
    is_public?: boolean
    subscription_free?: boolean
    owned?: boolean
    can_use?: boolean
    subscription_unlocked?: boolean
    published_at?: string | null
    gifted?: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

export interface RoyaltyDesignPiece {
    id?: string
    label?: string
    enabled?: boolean
    source_x?: number
    source_y?: number
    source_w?: number
    source_h?: number
    x?: number
    y?: number
    w?: number
    h?: number
    move_x?: number
    move_y?: number
    fit_mode?: 'cover' | 'stretch' | 'stay'
    position_x?: number
    position_y?: number
    background_color?: string
    border_radius?: number
    opacity?: number
    rotation?: number
    z_index?: number
}

export interface RoyaltyDesignImageLayer {
    id?: string
    name?: string
    preview_url?: string
    x?: number
    y?: number
    w?: number
    h?: number
    fit_mode?: 'cover' | 'stretch' | 'stay'
    position_x?: number
    position_y?: number
    move_x?: number
    move_y?: number
    rotation?: number
    opacity?: number
    z_index?: number
}

export interface ArtistProfileBlock {
    id: string
    user_id: string
    type: ProfileBlockType
    text_content: string | null
    image_path: string | null
    image_url: string | null
    source_art_image_id: string | null
    source_art_image?: ArtImage | null
    source_sticker_id: string | null
    source_sticker?: ArtistSticker | null
    is_sticker: boolean
    width: ProfileBlockWidth
    height: ProfileBlockHeight
    x: number
    y: number
    w: number
    h: number
    padding_x: number
    padding_y: number
    fit_mode: 'cover' | 'stretch' | 'stay'
    font_size: number
    z_index: number
    rotation: number
    background_color: string | null
    transparent_background: boolean
    overlay: boolean
    show_border: boolean
    border_color: string | null
    border_radius: number
    font_family: string | null
    font_color: string | null
    locked: boolean
    image_position_x: number
    image_position_y: number
    sort_order: number
    created_at: string
    updated_at: string
}

export interface ArtistSticker {
    id: string
    user_id: string
    name: string
    description?: string | null
    bundle_name?: string | null
    is_free?: boolean
    credit_cost?: number
    purchase_cost?: number
    is_public?: boolean
    subscription_free?: boolean
    subscription_unlocked?: boolean
    gifted?: boolean
    published_at?: string | null
    image_path: string
    sort_order: number
    subscriptions_count?: number
    purchases_count?: number
    library_status?: 'created' | 'subscribed' | 'bought'
    owned?: boolean
    bought?: boolean
    subscribed?: boolean
    can_use?: boolean
    owner?: {
        id: string
        name: string
        username: string
        avatar: string | null
    } | null
    created_at: string
    updated_at: string
}

export interface ArtistStickerLibraryResponse {
    stats: {
        total: number
        created: number
        subscribed: number
        bought: number
    }
    owned: ArtistSticker[]
    subscribed: ArtistSticker[]
    bought: ArtistSticker[]
}

export interface ArtistProfileWork {
    id: string
    slug: string
    title: string
    description: string | null
    type: 'webtoon' | 'wattpad'
    genres: string[]
    language: 'en' | 'ko' | 'id' | 'th'
    cover: string | null
    status: string
    views: number
    likes: number
    chapters_count: number
    created_at: string
}

export interface ArtistProfileResponse {
    artist: ArtistProfileUser
    borders: ProfileBorder[]
    blocks: ArtistProfileBlock[]
    stickers: ArtistSticker[]
    arts: Art[]
    works: ArtistProfileWork[]
    feeds?: FeedPost[]
    stats?: {
        works_total: number
        arts_total: number
        followers_count: number
        total_likes: number
        feed_posts_count: number
        is_following: boolean
    }
    comments?: Array<{
        id: string
        parent_id?: string | null
        body: string | null
        likes_count?: number
        replies_count?: number
        super_likes_count?: number
        awards?: Array<{
            id: string | null
            name: string
            icon: string
            credit_cost: number
            count: number
        }>
        parent?: {
            id: string
            body: string | null
            user: {
                name: string
                username: string
            } | null
        } | null
        created_at: string
        origin: {
            type: string
            title: string
            href: string | null
        }
        sticker?: {
            id: string
            name: string
            image_path: string
        } | null
    }>
}
