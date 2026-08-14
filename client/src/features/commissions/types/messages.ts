import type { RoyaltyDesignAsset } from '@/types/artistProfile'

// Inbox models ----
export type UploadType = 'image' | 'sketch' | 'revision' | 'final'
export type InboxFilter = 'all' | 'commission' | 'order' | 'general' | 'archived'

export interface Thread {
    id: string
    type: 'general' | 'commission' | 'order' | 'support'
    status: string
    quote_credits: number
    escrow_credits: number
    archived_at: string | null
    unread_count: number
    service: { title: string; image_path: string | null } | null
    other_user: {
        id: string
        name: string
        username: string
        avatar: string | null
        artist_verified: boolean
    } | null
    last_message: Message | null
}

export interface Message {
    id: string
    body: string | null
    kind: 'message' | 'system' | 'stage_submission' | 'final_delivery'
    upload_type: UploadType | null
    stage_index: number | null
    approval_status: 'pending' | 'approved' | 'adjustment' | null
    delivery_file: DeliveryFile | null
    image_path: string | null
    image_moderation_status?: string
    read_by_recipient: boolean
    created_at: string
    sender: { id: string; name: string; username: string; avatar: string | null } | null
}

export interface DeliveryFile {
    id: string
    file_path: string
    preview_path?: string | null
    original_name: string | null
    moderation_status: string
}

// Commission models ----
export interface CommissionStep {
    type: string
    label: string
    percent?: number
    rounds?: number
}

export type CommissionQuoteStatus =
    | 'pending'
    | 'renegotiation_requested'
    | 'superseded'
    | 'accepted'
    | 'rejected'
    | 'withdrawn'

export interface CommissionQuote {
    id: string
    version: number
    quote_credits: number
    quote_note: string | null
    flow_snapshot: CommissionStep[]
    status: CommissionQuoteStatus
    renegotiation_reason: string | null
    preferred_credits: number | null
    requested_changes: string | null
    renegotiation_requested_at: string | null
    accepted_at: string | null
    rejected_at: string | null
    rejection_reason: string | null
    superseded_at: string | null
    created_at: string
    updated_at: string
    creator: {
        id: string
        name: string
        username: string
        avatar: string | null
    } | null
}

export interface CommissionRevision {
    id: string
    reason: string
    revision_number: number
    requested_step_index: number | null
    requested_step_type: string | null
    extra_attempt_credits: number
    status: string
    created_at: string
    requester: { id: string; name: string; username: string; avatar: string | null } | null
}

export interface OrderInfo {
    id: string
    status: string
    quote_credits: number
    quote_note: string | null
    escrow_credits: number
    released_credits: number
    refunded_credits: number
    request_message: string | null
    reference_notes: string | null
    request_answers?: { question_id?: string; question?: string; answer?: string }[]
    client_details?: Record<string, string>
    flow_snapshot: CommissionStep[]
    paid_steps: number[]
    stage_attempts_used: Record<string, number>
    current_step_index: number
    auto_release_at: string | null
    payment_due_at: string | null
    final_payment_paid_at: string | null
    final_payment_due_credits: number
    extra_attempt_credits: number
    archived_at: string | null
    revisions: CommissionRevision[]
    quotes?: CommissionQuote[]
    service: { title: string; image_path: string | null } | null
    artist?: { id: string; name: string; username: string } | null
    customer?: { id: string; name: string; username: string } | null
}

// Message settings ----
export interface MessagePreferences {
    message_read_receipts_enabled: boolean
    message_design_id: string | null
    message_background_id: string | null
}

export interface MessagePreferenceResponse {
    preferences: MessagePreferences
    message_designs: RoyaltyDesignAsset[]
    message_backgrounds: RoyaltyDesignAsset[]
}

export interface MessagePagination {
    has_more: boolean
    next_before: string | null
    limit: number
}

export interface MessageResponse {
    order: OrderInfo
    messages: Message[]
    pagination: MessagePagination
}
