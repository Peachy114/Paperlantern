export type ShopDownload = {
    id: string
    slug: string
    title: string
    description?: string | null
    labels: string[]
    image_path: string | null
    download_policy: 'free' | 'paid'
    credit_cost: number
    price?: number | string | null
    currency?: string | null
    rating?: number | null
    ratings_count?: number
    user_rating?: number | null
    sold_count?: number | null
    is_popular?: boolean
    is_new?: boolean
    download_unlocked?: boolean
    files_count: number
    likes: number
    comments_count: number
    downloads_count: number
    created_at?: string
    href: string
    source?: 'admin' | 'artist'
    source_label?: string
    artist?: {
        id?: string
        name: string
        username: string
        avatar?: string | null
        verified?: boolean
        badges?: string[]
    } | null
}

export type ShopSticker = {
    id: string
    name: string
    bundle_name?: string | null
    image_path: string | null
    is_free: boolean
    credit_cost: number
    href: string
    usage: {
        stickers?: boolean
        comments: boolean
        profile: boolean
        backgrounds: boolean
        messages: boolean
    }
    artist?: { name: string; username: string; avatar?: string | null } | null
    source?: 'admin' | 'artist'
    source_label?: string
    owned?: boolean
    can_use?: boolean
}
