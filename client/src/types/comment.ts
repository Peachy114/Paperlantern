import type { ArtistSticker } from '@/types/artistProfile'

export type CommentTargetType = 'work' | 'chapter' | 'art' | 'comment'
export type CommentSort = 'all' | 'latest' | 'popular'

export interface PublicComment {
    id: string
    body: string | null
    super_likes_count: number
    super_like_credits: number
    created_at: string
    user: {
        id: string
        name: string
        username: string
        avatar: string | null
    } | null
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
