import api from '@/api/axios'
import { type Ticket, type CreateTicketPayload, type TicketReply } from '../types/tickets'

export const ticketsApi = {
    list: () => api.get<Ticket[]>('/tickets'),
    show: (id: string) => api.get<Ticket>(`/tickets/${id}`),
    create: (payload: CreateTicketPayload) => api.post<Ticket>('/tickets', payload),

    replies: (ticketId: string) => api.get<TicketReply[]>(`/tickets/${ticketId}/replies`),
    sendReply: (ticketId: string, message: string) =>
        api.post<TicketReply>(`/tickets/${ticketId}/replies`, { message }),
}
