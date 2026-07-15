export type ArtStatus = 'draft' | 'published' | 'archived'
export type ArtDownloadPolicy = 'disabled' | 'free' | 'paid'

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
    download_policy: ArtDownloadPolicy
    download_credits: number
    download_unlocked?: boolean
    downloads_count: number
    apply_watermark: boolean
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
    commission_profile: CommissionProfile
    arts: Art[]
}

export type CommissionApplicationStatus =
    | 'not_applied'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'

export interface CommissionProfile {
    id?: string
    application_status: CommissionApplicationStatus
    commissions_enabled: boolean
    commission_status: 'open' | 'waitlist' | 'closed'
    application_reason: string | null
    terms: string | null
    terms_moderation_status: 'pending' | 'approved' | 'hidden' | 'suspended'
    customers_count: number
    average_rating: number
    ratings_count: number
}
