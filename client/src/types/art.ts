export type ArtStatus = 'draft' | 'published' | 'archived'

export interface Art {
    id: string
    slug: string
    title: string
    description: string | null
    labels: string[] | null
    image_path: string
    images: ArtImage[]
    status: ArtStatus
    moderation_status: 'pending' | 'approved' | 'rejected'
    views: number
    likes: number
    liked_by_me?: boolean
    comments_count: number
    super_likes_count: number
    super_like_credits: number
    public_sort_order?: number | null
    boosted_until?: string | null
    user?: {
        id: string
        name: string
        username: string
        role: 'super_admin' | 'storyteller' | 'wanderer'
        avatar?: string | null
        artist_verified?: boolean
    } | null
    created_at: string
    updated_at: string
    deleted_at?: string | null
}

export interface ArtImage {
    id: string
    art_id: string
    image_path: string
    description: string | null
    sort_order: number
    created_at: string
    updated_at: string
}

export interface MyArtsStats {
    arts: number
    views: number
    likes: number
    comments: number
    super_likes: number
    super_like_credits: number
}

export interface MyArtsDashboardResponse {
    stats: MyArtsStats
    arts: Art[]
}
