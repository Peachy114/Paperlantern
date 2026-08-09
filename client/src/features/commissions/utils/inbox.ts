import type { InboxFilter, Thread } from '@/features/commissions/types/messages'

// Inbox filters ----
export const INBOX_FILTERS: { value: InboxFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'commission', label: 'Commissions' },
    { value: 'order', label: 'Shop Orders' },
    { value: 'general', label: 'General' },
    { value: 'archived', label: 'Archived' },
]

export const INBOX_FILTER_LABELS: Record<InboxFilter, string> = {
    all: 'All',
    commission: 'Commission',
    order: 'Shop order',
    general: 'General',
    archived: 'Archived',
}

export function threadMatchesInboxFilter(thread: Thread, filter: InboxFilter) {
    if (filter === 'all') return !thread.archived_at
    if (filter === 'archived') return Boolean(thread.archived_at)
    return thread.type === filter && !thread.archived_at
}

export function inboxFilterCounts(threads: Thread[]): Record<InboxFilter, number> {
    return {
        all: threads
            .filter((thread) => !thread.archived_at)
            .reduce((sum, thread) => sum + thread.unread_count, 0),
        commission: threads
            .filter((thread) => thread.type === 'commission' && !thread.archived_at)
            .reduce((sum, thread) => sum + thread.unread_count, 0),
        order: threads
            .filter((thread) => thread.type === 'order' && !thread.archived_at)
            .reduce((sum, thread) => sum + thread.unread_count, 0),
        general: threads
            .filter((thread) => thread.type === 'general' && !thread.archived_at)
            .reduce((sum, thread) => sum + thread.unread_count, 0),
        archived: threads
            .filter((thread) => Boolean(thread.archived_at))
            .reduce((sum, thread) => sum + thread.unread_count, 0),
    }
}

// Thread labels ----
export function threadTitle(thread: Thread) {
    if (thread.type === 'commission') return thread.service?.title ?? 'Commission request'
    if (thread.type === 'order') return thread.service?.title ?? 'Shop order'
    return thread.other_user?.name ?? 'General message'
}

export function threadTypeLabel(thread: Thread) {
    if (thread.archived_at) return 'Archived'
    if (thread.type === 'commission') return thread.status.replace('_', ' ')
    if (thread.type === 'order') return 'Shop order'
    return 'General message'
}
