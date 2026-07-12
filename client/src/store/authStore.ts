import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string
    name: string
    username: string
    email: string
    role: 'super_admin' | 'storyteller' | 'wanderer'
    is_banned: boolean
    is_suspended?: boolean
    dark_mode?: boolean
    avatar?: string | null
    profile_cover?: string | null
    bio?: string | null
    artist_title?: string | null
    profile_background_color?: string | null
    profile_background_gradient_from?: string | null
    profile_background_gradient_to?: string | null
    profile_background_gradient_direction?: string
    profile_background_image?: string | null
    profile_background_blur?: number
    profile_banner_height?: number
    profile_avatar_frame_x?: number
    profile_avatar_frame_y?: number
    profile_avatar_border_width?: number
    profile_avatar_border_color?: string | null
    profile_avatar_border_radius?: number
    profile_nav_layout?: 'together' | 'separate'
    profile_nav_x?: number
    profile_nav_y?: number
    profile_nav_w?: number
    profile_nav_h?: number
    profile_board_min_height?: number
    profile_arts_tile_width?: number
    profile_sticker_size?: number
    profile_show_cover?: boolean
    profile_cover_width?: number
    profile_background_has_gradient?: boolean
    profile_tabs_config?: unknown
    profile_links?: unknown
    profile_border_id?: string | null
    twitter_url?: string | null
    instagram_url?: string | null
    tiktok_url?: string | null
}

interface AuthState {
    user: User | null
    token: string | null
    setAuth: (user: User, token: string) => void
    clearAuth: () => void
    setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (user, token) => set({ user, token }),
            clearAuth: () => set({ user: null, token: null }),
            setUser: (user) => set({ user }),
        }),
        { name: 'auth-storage' }
    )
)
