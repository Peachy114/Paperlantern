import type { ProfileTabsConfig } from '@/types/artistProfile'
import type { PageWidgetBackgroundPreset } from '@/types/pageLayout'

export type ProfileSurfaceStyle = {
    enabled?: boolean
    preset?: PageWidgetBackgroundPreset
    custom_color?: string
    opacity?: number
    border?: boolean
    border_color?: string
    border_opacity?: number
    border_width?: number
    border_radius?: number
}

// Profile canvas group types ----
export type ProfileCanvasGroup = {
    id: string
    name: string
    item_ids: string[]
}

// Profile light and dark theme color settings ----
export type ExtendedGlobalStyles = NonNullable<ProfileTabsConfig['global_styles']> & {
    heading_text_color?: string
    label_text_color?: string
    button_text_color?: string
    link_text_color?: string
    background_color_opacity?: number
    header_background_enabled?: boolean
    header_background_color?: string
    header_background_opacity?: number
    identity_x?: number
    identity_y?: number
    identity_position_enabled?: boolean
    profile_image_position_enabled?: boolean
    profile_image_x?: number
    profile_image_y?: number
    show_profile_info?: boolean
    cover_image_fit?: 'cover' | 'contain'
    avatar_image_fit?: 'cover' | 'contain'
    background_image_fit?: 'cover' | 'contain'
    cover_image_zoom?: number
    background_image_position_x?: number
    background_image_position_y?: number
    background_image_zoom?: number
    dark_text_color?: string
    dark_muted_text_color?: string
    dark_accent_color?: string
    dark_heading_text_color?: string
    dark_label_text_color?: string
    dark_button_text_color?: string
    dark_link_text_color?: string
    profile_name_color?: string
    profile_details_color?: string
    profile_links_color?: string
    cards_color?: string
    dark_cards_color?: string
    labels_color?: string
    profile_name_size?: number
    profile_details_size?: number
    profile_links_size?: number
    cards_size?: number
    labels_size?: number
    dashboard_cards_visible?: Partial<Record<'works' | 'arts' | 'followers' | 'feeds', boolean>>
    cards_background_enabled?: boolean
    buttons_background_enabled?: boolean
    cards_surface?: ProfileSurfaceStyle
    buttons_surface?: ProfileSurfaceStyle
    content_surface?: ProfileSurfaceStyle
    canvas_groups?: ProfileCanvasGroup[]
}
