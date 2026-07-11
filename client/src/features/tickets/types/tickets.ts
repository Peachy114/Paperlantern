export type TicketCategory = 'bug' | 'account' | 'payment' | 'other'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface Ticket {
    id: string
    user_id: string
    category: TicketCategory
    subject: string
    message: string
    status: TicketStatus
    source_type?: string | null
    source_id?: string | null
    admin_notes: string | null
    resolved_at: string | null
    created_at: string
    updated_at: string
    latest_reply: {
        is_admin: boolean
        created_at: string
    } | null
}

export interface CreateTicketPayload {
    category: TicketCategory
    subject: string
    message: string
}

export interface TicketReply {
    id: string
    ticket_id: string
    user_id: string
    message: string
    is_admin: boolean
    created_at: string
    user: {
        id: string
        name: string
    }
}
