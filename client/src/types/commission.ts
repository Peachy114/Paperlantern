export interface CommissionCategory {
    id: string
    name: string
    slug: string
}

export interface CommissionFlowStep {
    type: 'request' | 'quote' | 'pay' | 'process' | 'receipt' | string
    label: string
    percent?: number
}

export interface CommissionArtist {
    id: string
    name: string
    username: string
    avatar: string | null
    artist_title: string | null
    artist_verified: boolean
    commission_status: 'open' | 'waitlist' | 'closed'
}

export interface CommissionRating {
    id: string
    rating: number
    comment: string | null
    created_at: string
    customer: {
        id: string
        name: string
        username: string
        avatar: string | null
    } | null
}

export interface CommissionService {
    id: string
    title: string
    slug: string
    description: string | null
    image_path: string | null
    status: 'open' | 'waitlist' | 'closed'
    boosted_until?: string | null
    base_price_credits: number
    min_price_credits: number | null
    delivery_days: number | null
    slots_available: number | null
    flow: CommissionFlowStep[]
    terms: string | null
    quote_rules: string | null
    refund_policy: string | null
    required_references: string | null
    artist_terms: string | null
    platform_terms: string[]
    rating_average: number
    ratings_count: number
    customers_count: number
    category: CommissionCategory | null
    artist: CommissionArtist | null
    recent_ratings: CommissionRating[]
}

export interface CommissionsResponse {
    categories: CommissionCategory[]
    platform_terms: string[]
    commissions: {
        data: CommissionService[]
    }
}
