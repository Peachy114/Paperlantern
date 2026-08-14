import type { RoyaltyDesignType } from '@/types/artistProfile'

// Noble Royalty editor model ----
export type Tab = 'stickers' | 'borders' | 'rewards' | 'subscriptions' | 'message_designs' | 'message_backgrounds' | 'comment_borders' | 'board_buttons'
export type GiftAssetType = 'sticker' | 'border' | 'design'
export type DesignPieceKey =
    | 'top_left'
    | 'top'
    | 'top_right'
    | 'left'
    | 'center'
    | 'right'
    | 'bottom_left'
    | 'bottom'
    | 'bottom_right'

export type DesignPieceSettings = {
    id?: string
    label: string
    enabled: boolean
    source_x: number
    source_y: number
    source_w: number
    source_h: number
    x: number
    y: number
    w: number
    h: number
    move_x: number
    move_y: number
    fit_mode: 'cover' | 'stretch' | 'stay'
    position_x: number
    position_y: number
    background_color: string
    border_radius: number
    opacity: number
    rotation: number
    z_index: number
}

export type DesignImageLayer = {
    id: string
    name: string
    preview_url: string
    x: number
    y: number
    w: number
    h: number
    fit_mode: 'cover' | 'stretch' | 'stay'
    position_x: number
    position_y: number
    move_x: number
    move_y: number
    rotation: number
    opacity: number
    z_index: number
}

export type AssetForm = {
    name: string
    description: string
    bundle_name: string
    is_free: boolean
    credit_cost: number
    subscription_free: boolean
    publish_public: boolean
    images: File[]
    sticker_names: string[]
    preview_urls: string[]
    style_settings: DesignStyleSettings
}

export type DesignStyleSettings = {
    design_source: 'simple' | 'image' | 'gif'
    simple_theme: 'classic' | 'comic' | 'glass' | 'pixel' | 'svg' | 'image_card'
    simple_tail: 'straight' | 'curve' | 'none'
    simple_accent: string
    simple_received_bg: string
    simple_sent_bg: string
    simple_border_width: number
    simple_border_color: string
    simple_radius: number
    simple_bg_mode: 'color' | 'image'
    simple_bg_image: string
    simple_bg_fit: 'cover' | 'contain' | 'stretch'
    simple_background: string
    font_url: string
    text_transform: 'none' | 'uppercase' | 'lowercase'
    design_mode: 'slice' | 'custom'
    sample_text: string
    font_family: string
    font_size: number
    font_weight: 'normal' | 'medium' | 'bold'
    font_style: 'normal' | 'italic'
    text_align: 'left' | 'center' | 'right'
    content_align_y: 'start' | 'center' | 'end'
    content_x: number
    content_y: number
    content_w: number
    content_h: number
    name_layer: number
    text_layer: number
    content_layer: number
    text_name_combined_layer: boolean
    preview_width: number
    preview_height: number
    fit_mode: 'cover' | 'stretch' | 'stay'
    position_x: number
    position_y: number
    move_x: number
    move_y: number
    slice_top: number
    slice_right: number
    slice_bottom: number
    slice_left: number
    clip_to_parent: boolean
    trim_transparent_padding: boolean
    show_grid: boolean
    allow_overlap: boolean
    custom_parts: Record<DesignPieceKey, DesignPieceSettings>
    custom_extra_pieces: DesignPieceSettings[]
    image_layers: DesignImageLayer[]
}

export const DESIGN_PIECES: Array<{ key: DesignPieceKey; label: string; x: number; y: number; w: number; h: number }> = [
    { key: 'top_left', label: 'Top left', x: 0, y: 0, w: 24, h: 24 },
    { key: 'top', label: 'Top side', x: 24, y: 0, w: 312, h: 24 },
    { key: 'top_right', label: 'Top right', x: 336, y: 0, w: 24, h: 24 },
    { key: 'left', label: 'Left side', x: 0, y: 24, w: 24, h: 72 },
    { key: 'center', label: 'Text center', x: 24, y: 24, w: 312, h: 72 },
    { key: 'right', label: 'Right side', x: 336, y: 24, w: 24, h: 72 },
    { key: 'bottom_left', label: 'Bottom left', x: 0, y: 96, w: 24, h: 24 },
    { key: 'bottom', label: 'Bottom side', x: 24, y: 96, w: 312, h: 24 },
    { key: 'bottom_right', label: 'Bottom right', x: 336, y: 96, w: 24, h: 24 },
]

export function defaultPiece(seed: (typeof DESIGN_PIECES)[number], width: number, height: number): DesignPieceSettings {
    const scaleX = width / 360
    const scaleY = height / 120

    return {
        label: seed.label,
        enabled: true,
        source_x: Math.round(seed.x * scaleX),
        source_y: Math.round(seed.y * scaleY),
        source_w: Math.max(8, Math.round(seed.w * scaleX)),
        source_h: Math.max(8, Math.round(seed.h * scaleY)),
        x: Math.round(seed.x * scaleX),
        y: Math.round(seed.y * scaleY),
        w: Math.max(8, Math.round(seed.w * scaleX)),
        h: Math.max(8, Math.round(seed.h * scaleY)),
        move_x: 0,
        move_y: 0,
        fit_mode: seed.key === 'center' || seed.key === 'top' || seed.key === 'bottom' || seed.key === 'left' || seed.key === 'right' ? 'stretch' : 'stay',
        position_x: 50,
        position_y: 50,
        background_color: seed.key === 'center' ? 'transparent' : '',
        border_radius: 0,
        opacity: 100,
        rotation: 0,
        z_index: seed.key === 'center' ? 1 : 0,
    }
}

export function defaultCustomParts(width = 360, height = 120): Record<DesignPieceKey, DesignPieceSettings> {
    return DESIGN_PIECES.reduce((parts, seed) => {
        parts[seed.key] = defaultPiece(seed, width, height)
        return parts
    }, {} as Record<DesignPieceKey, DesignPieceSettings>)
}

export type RewardForm = {
    id?: string
    name: string
    icon: string
    credit_cost: number
    is_active: boolean
    sort_order: number
}

export type PlanForm = {
    id?: string
    name: string
    slug: string
    audience: 'wanderer' | 'storyteller'
    tier_key: 'starter' | 'plus' | 'atelier'
    description: string
    monthly_credit_cost: number
    promo_label: string
    promo_credit_cost: number | ''
    promo_start_at: string
    promo_end_at: string
    is_recommended: boolean
    is_active: boolean
    unlimited_board: boolean
    board_limit: number
    free_boost_days: number
    early_access: boolean
    perks: string
    sort_order: number
}

export type GiftForm = {
    recipient_username: string
    asset_type: GiftAssetType
    asset_id: string
    asset_name: string
    note: string
}

export const EMPTY_ASSET: AssetForm = {
    name: '',
    description: '',
    bundle_name: '',
    is_free: false,
    credit_cost: 1,
    subscription_free: false,
    publish_public: true,
    images: [],
    sticker_names: [],
    preview_urls: [],
    style_settings: {
        design_source: 'image',
        simple_theme: 'classic',
        simple_tail: 'curve',
        simple_accent: '#7c3aed',
        simple_received_bg: '#e2e8f0',
        simple_sent_bg: '#7c3aed',
        simple_border_width: 0,
        simple_border_color: '#111827',
        simple_radius: 18,
        simple_bg_mode: 'color',
        simple_bg_image: '',
        simple_bg_fit: 'cover',
        simple_background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
        font_url: '',
        text_transform: 'none',
        design_mode: 'slice',
        sample_text: 'Preview text that can become longer',
        font_family: '',
        font_size: 14,
        font_weight: 'medium',
        font_style: 'normal',
        text_align: 'center',
        content_align_y: 'center',
        content_x: 20,
        content_y: 28,
        content_w: 320,
        content_h: 64,
        name_layer: 4,
        text_layer: 5,
        content_layer: 3,
        text_name_combined_layer: false,
        preview_width: 360,
        preview_height: 120,
        fit_mode: 'stretch',
        position_x: 50,
        position_y: 50,
        move_x: 0,
        move_y: 0,
        slice_top: 24,
        slice_right: 24,
        slice_bottom: 24,
        slice_left: 24,
        clip_to_parent: true,
        trim_transparent_padding: false,
        show_grid: true,
        allow_overlap: true,
        custom_parts: defaultCustomParts(360, 120),
        custom_extra_pieces: [],
        image_layers: [],
    },
}
export const EMPTY_REWARD: RewardForm = {
    name: '',
    icon: 'star',
    credit_cost: 1,
    is_active: true,
    sort_order: 0,
}
export const EMPTY_PLAN: PlanForm = {
    name: '',
    slug: '',
    audience: 'wanderer',
    tier_key: 'starter',
    description: '',
    monthly_credit_cost: 60,
    promo_label: '',
    promo_credit_cost: '',
    promo_start_at: '',
    promo_end_at: '',
    is_recommended: false,
    is_active: true,
    unlimited_board: false,
    board_limit: 25,
    free_boost_days: 1,
    early_access: true,
    perks: '',
    sort_order: 0,
}
export const EMPTY_GIFT: GiftForm = {
    recipient_username: '',
    asset_type: 'sticker',
    asset_id: '',
    asset_name: '',
    note: '',
}

export const TABS: Tab[] = ['stickers', 'borders', 'rewards', 'subscriptions', 'message_designs', 'message_backgrounds', 'comment_borders', 'board_buttons']

export const DESIGN_TAB_TYPES: Partial<Record<Tab, RoyaltyDesignType>> = {
    message_designs: 'message_design',
    message_backgrounds: 'message_background',
    comment_borders: 'comment_border',
    board_buttons: 'board_button',
}

export const TAB_LABELS: Record<Tab, string> = {
    stickers: 'Stickers',
    borders: 'Borders',
    rewards: 'Rewards',
    subscriptions: 'Subscriptions',
    message_designs: 'Messages',
    message_backgrounds: 'Message Backgrounds',
    comment_borders: 'Comment Borders',
    board_buttons: 'Board Buttons',
}

