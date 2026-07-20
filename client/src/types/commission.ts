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

export interface CommissionRequestQuestion {
    id: string
    title: string
    description?: string
    type: 'textarea' | 'short_text' | 'multiple_choice' | 'date' | 'checkbox' | string
    required: boolean
    options?: string[]
}

export interface CommissionInfoQuestion {
    id: string
    question: string
    answer: string
}

export interface CommissionClientFields {
    name: { collect: boolean; required: boolean }
    nickname: { collect: boolean; required: boolean }
    email: { collect: boolean; required: boolean }
    discord: { collect: boolean; required: boolean }
    twitter: { collect: boolean; required: boolean }
    instagram: { collect: boolean; required: boolean }
    facebook: { collect: boolean; required: boolean }
    tiktok: { collect: boolean; required: boolean }
}

export interface CommissionPromoDiscount {
    id: string
    label: string
    type: 'percent' | 'fixed'
    amount: number
    starts_at?: string | null
    ends_at?: string | null
    active: boolean
}

export interface CommissionSetupOptions {
    visibility: 'discoverable' | 'hidden'
    service_type: 'custom' | 'personalized'
    communication_style: 'open' | 'surprise'
    requesting_process: 'custom_proposal' | 'instant_order'
    notify_followers_on_status_change: boolean
    sensitive: boolean
    display_service_stats: boolean
    estimated_start?: string | null
    start_time?: string | null
    end_time?: string | null
    guaranteed_delivery_days?: number | null
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
    is_featured?: boolean
    flow: CommissionFlowStep[]
    terms: string | null
    quote_rules: string | null
    refund_policy: string | null
    required_references: string | null
    request_questions: CommissionRequestQuestion[]
    info_questions: CommissionInfoQuestion[]
    client_fields: CommissionClientFields
    promo_discounts: CommissionPromoDiscount[]
    setup_options: CommissionSetupOptions
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
