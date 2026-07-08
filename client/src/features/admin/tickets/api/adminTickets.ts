import api from '@/api/axios'
import { type Ticket, type TicketStatus, type TicketReply } from '@/features/tickets/types/tickets'

export interface AdminTicketFilters {
    status?: TicketStatus
    category?: string
}

export interface UpdateTicketPayload {
    status?: TicketStatus
    admin_notes?: string
}

export const adminTicketsApi = {
    list: (filters: AdminTicketFilters = {}) =>
        api.get<Ticket[]>('/admin/tickets', { params: filters }),

    update: (id: string, payload: UpdateTicketPayload) =>
        api.patch<Ticket>(`/admin/tickets/${id}`, payload),

    destroy: (id: string) => api.delete(`/admin/tickets/${id}`),

    export: () => api.get('/admin/tickets-export', { responseType: 'blob' }),

    replies: (ticketId: string) => api.get<TicketReply[]>(`/admin/tickets/${ticketId}/replies`),

    sendReply: (ticketId: string, message: string) =>
        api.post<TicketReply>(`/admin/tickets/${ticketId}/replies`, { message }),

    show: (id: string) => api.get<Ticket>(`/admin/tickets/${id}`),
}
