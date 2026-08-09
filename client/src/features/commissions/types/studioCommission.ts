import type { CommissionProfile } from '@/types/art'

// Service models ----
export type ServiceStatus = 'open' | 'waitlist' | 'closed' | 'paused'
export type FlowType = 'pay' | 'sketch' | 'revision' | 'add' | 'done'

export interface CommissionCategory {
    id: string
    name: string
    slug: string
}

export interface FlowStep {
    type: FlowType
    label: string
    percent?: number
    rounds?: number
}

export interface RequestQuestion {
    id: string
    title: string
    description: string
    type: 'textarea' | 'short_text' | 'multiple_choice' | 'date' | 'checkbox'
    required: boolean
    options: string[]
}

export interface InfoQuestion {
    id: string
    question: string
    answer: string
}

export interface ClientFields extends Record<string, { collect: boolean; required: boolean }> {
    name: { collect: boolean; required: boolean }
    username: { collect: boolean; required: boolean }
    email: { collect: boolean; required: boolean }
    discord: { collect: boolean; required: boolean }
    twitter: { collect: boolean; required: boolean }
    instagram: { collect: boolean; required: boolean }
    facebook: { collect: boolean; required: boolean }
    tiktok: { collect: boolean; required: boolean }
}

export interface PromoDiscount {
    id: string
    label: string
    type: 'percent' | 'fixed'
    amount: number
    starts_at: string
    ends_at: string
    active: boolean
}

export interface SetupOptions {
    visibility: 'discoverable' | 'hidden'
    service_type: 'custom' | 'personalized'
    communication_style: 'open' | 'surprise'
    requesting_process: 'custom_proposal' | 'instant_order'
    notify_followers_on_status_change: boolean
    sensitive: boolean
    display_service_stats: boolean
    estimated_start: string
    start_time: string
    end_time: string
    guaranteed_delivery_days: number
}

export interface CommissionService {
    id: string
    title: string
    slug: string
    description: string | null
    image_path: string | null
    base_price_credits: number
    min_price_credits: number | null
    delivery_days: number | null
    slots_available: number | null
    status: ServiceStatus
    flow: FlowStep[]
    terms: string | null
    quote_rules: string | null
    refund_policy: string | null
    required_references: string | null
    request_questions: RequestQuestion[]
    info_questions: InfoQuestion[]
    client_fields: ClientFields
    promo_discounts: PromoDiscount[]
    setup_options: SetupOptions
    is_published: boolean
    boosted_until?: string | null
    commission_category_id: string | null
    category: CommissionCategory | null
}

// Order models ----
export interface CommissionRevision {
    id: string
    reason: string
    revision_number: number
    status: 'requested' | 'in_progress' | 'resolved' | 'rejected'
    artist_response: string | null
    created_at: string
}

export interface CommissionDeliveryFile {
    id: string
    file_path: string
    preview_path?: string | null
    original_name: string | null
    note: string | null
    moderation_status: 'pending' | 'approved' | 'suspended'
    created_at: string
}

export interface CommissionOrder {
    id: string
    status:
        | 'requested'
        | 'awaiting_payment'
        | 'in_progress'
        | 'delivered'
        | 'completed'
        | 'cancelled'
        | 'disputed'
    request_message: string | null
    reference_notes: string | null
    quote_credits: number
    credits_checked: number
    escrow_credits: number
    released_credits: number
    refunded_credits: number
    quote_note: string | null
    flow_snapshot: FlowStep[]
    paid_steps: number[]
    stage_notes: Record<string, any>
    current_step_index: number
    auto_release_at: string | null
    payment_due_at: string | null
    quote_accepted_at: string | null
    archived_at: string | null
    revision_limit: number
    revisions: CommissionRevision[]
    delivery_files: CommissionDeliveryFile[]
    created_at: string
    service: {
        id: string
        title: string
        slug: string
        image_path: string | null
        base_price_credits?: number
    } | null
    customer: {
        id: string
        name: string
        username: string
        avatar: string | null
    } | null
}

export interface CommissionRating {
    id: string
    rating: number
    comment: string | null
    status: 'published' | 'appealed' | 'hidden'
    appeal_reason: string | null
    created_at: string
    service: { title: string; slug: string } | null
    customer: { name: string; username: string; avatar: string | null } | null
}

// Page response ----
export interface CommissionWidgetsData {
    total_orders: number
    active_orders: number
    completed_orders: number
    commission_earnings: number
    works_earnings: number
    arts_earnings: number
    super_like_earnings: number
    combined_creator_earnings: number
}

export interface CommissionPageResponse {
    commission_profile: CommissionProfile
    categories: CommissionCategory[]
    services: CommissionService[]
    orders: CommissionOrder[]
    ratings: CommissionRating[]
    widgets: CommissionWidgetsData
}

// Editor models ----
export interface ServiceForm {
    title: string
    commission_category_id: string
    description: string
    image: File | null
    imagePreview: string | null
    base_price_credits: number
    min_price_credits: number
    delivery_days: number
    slots_available: number
    status: ServiceStatus
    is_published: boolean
    terms: string
    quote_rules: string
    refund_policy: string
    required_references: string
    request_questions: RequestQuestion[]
    info_questions: InfoQuestion[]
    client_fields: ClientFields
    promo_discounts: PromoDiscount[]
    setup_options: SetupOptions
    flow: FlowStep[]
}

export interface ConfirmAction {
    title: string
    description: string
    confirmLabel: string
    destructive?: boolean
    onConfirm: () => void
}
