import type { ArtistSticker } from '@/types/artistProfile'

export type CommentTargetType = 'work' | 'chapter' | 'art' | 'comment'
export type CommentSort = 'all' | 'latest' | 'popular'

export interface SuperLikeAward {
    id: string
    name: string
    icon: 'star' | 'rocket' | 'glasses' | string
    credit_cost: number
    is_active?: boolean
    sort_order?: number
    count?: number
}

export interface PublicComment {
    id: string
    parent_id?: string | null
    body: string | null
    reaction_emoji: string | null
    gif_url: string | null
    image_url: string | null
    image_path?: string | null
    image_moderation_status?: string | null
    is_spoiler: boolean
    is_pinned: boolean
    likes_count: number
    liked_by_me: boolean
    replies_count: number
    super_likes_count: number
    super_like_credits: number
    awards?: SuperLikeAward[]
    created_at: string
    user: {
        id: string
        name: string
        username: string
        avatar: string | null
        role?: 'super_admin' | 'storyteller' | 'wanderer'
        artist_verified?: boolean
    } | null
    parent?: {
        id: string
        body: string | null
        user: {
            name: string
            username: string
        } | null
    } | null
    replies?: PublicComment[]
    sticker: {
        id: string
        name: string
        image_path: string
    } | null
}

export interface CommentPage {
    data: PublicComment[]
    current_page: number
    last_page: number
    total: number
}

export interface StickerStorePage {
    data: ArtistSticker[]
    current_page?: number
    last_page?: number
    total?: number
}
