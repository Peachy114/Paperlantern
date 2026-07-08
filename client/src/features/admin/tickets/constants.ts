import { type TicketStatus } from '@/features/tickets/types/tickets'

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
]

export const TICKET_CATEGORY_FILTERS = [
    { value: '', label: 'All Categories' },
    { value: 'bug', label: 'Bug' },
    { value: 'account', label: 'Account' },
    { value: 'payment', label: 'Payment' },
    { value: 'other', label: 'Other' },
]

export const TICKET_STATUS_FILTERS = [{ value: '', label: 'All Statuses' }, ...TICKET_STATUSES]

export const STATUS_STYLES: Record<TicketStatus, string> = {
    open: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
}
