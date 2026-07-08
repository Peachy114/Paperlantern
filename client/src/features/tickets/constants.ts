import { type TicketCategory } from './types/tickets'

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
    { value: 'bug', label: 'Bug' },
    { value: 'account', label: 'Account' },
    { value: 'payment', label: 'Payment' },
    { value: 'other', label: 'Other' },
]
