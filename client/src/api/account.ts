import api from './axios'

export interface AccountWork {
    id: string
    slug: string
    title: string
    type: 'webtoon' | 'wattpad'
    cover: string | null
    views: number
    likes: number
    favorites_count: number
    author?: {
        id: string
        name: string
        username: string
    } | null
}

export interface AccountFavorite {
    id: string
    created_at: string
    work: AccountWork
}

export interface AccountComment {
    id: string
    body: string | null
    public_highlight: boolean
    super_likes_count: number
    created_at: string
    origin: {
        type: string
        title: string
        subtitle: string | null
        href: string | null
    }
    sticker?: {
        id: string
        name: string
        image_path: string
    } | null
}

export interface AccountHistory {
    read: ChapterHistoryItem[]
    liked: ChapterHistoryItem[]
    commented: AccountComment[]
    bought: {
        chapters: ChapterHistoryItem[]
        transactions: WalletHistoryItem[]
    }
}

export interface ChapterHistoryItem {
    id: string
    type: string
    chapter: {
        id: string
        slug: string
        title: string
        order: number
    }
    work: AccountWork
    href: string
    created_at: string
}

export interface WalletHistoryItem {
    id: string
    type: string
    source: string
    description: string | null
    amount: number
    created_at: string
}

export const accountApi = {
    favorites: () => api.get<{ data: AccountFavorite[] }>('/account/favorites'),
    comments: () => api.get<{ data: AccountComment[]; total: number }>('/account/comments'),
    setCommentHighlight: (id: string, publicHighlight: boolean) =>
        api.patch<AccountComment>(`/account/comments/${id}/highlight`, {
            public_highlight: publicHighlight,
        }),
    history: () => api.get<AccountHistory>('/account/history'),
}
