import type { CommissionQuote, CommissionRevision, CommissionStep, Message, OrderInfo, UploadType } from '@/features/commissions/types/messages'

// Message workflow ----
export function creativeSteps(order: OrderInfo | null) {
    return (order?.flow_snapshot ?? [])
        .map((step, index) => ({ step, index }))
        .filter(({ step }) => ['sketch', 'revision', 'draft', 'add'].includes(step.type))
}

export function buildTimeline(
    messages: Message[],
    revisions: CommissionRevision[],
    quotes: CommissionQuote[]
) {
    const messageItems = messages.map((message) => ({
        type: 'message' as const,
        createdAt: message.created_at,
        message,
    }))
    const revisionItems = revisions.map((revision) => ({
        type: 'revision' as const,
        createdAt: revision.created_at,
        revision,
    }))
    const quoteItems = quotes.map((quote) => ({
        type: 'quote' as const,
        createdAt: quote.created_at,
        quote,
    }))
    const priority = { quote: 0, revision: 1, message: 2 } as const

    return [...messageItems, ...revisionItems, ...quoteItems].sort((a, b) => {
        const timeDifference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()

        if (timeDifference !== 0) return timeDifference
        return priority[a.type] - priority[b.type]
    })
}

export function visibleRevisionItems(
    revisions: CommissionRevision[],
    messages: Message[],
    hasMore: boolean
) {
    if (!hasMore || messages.length === 0) return revisions

    const oldestLoadedAt = new Date(messages[0].created_at).getTime()
    return revisions.filter((revision) => new Date(revision.created_at).getTime() >= oldestLoadedAt)
}

export function mergeMessages(olderMessages: Message[], currentMessages: Message[]) {
    const seen = new Set<string>()
    return [...olderMessages, ...currentMessages].filter((message) => {
        if (seen.has(message.id)) return false
        seen.add(message.id)
        return true
    })
}

export function submissionNeedsAdjustment(message: Message, order: OrderInfo | null) {
    if (!order || message.kind !== 'stage_submission' || message.approval_status !== 'pending')
        return false

    return order.revisions.some((revision) => {
        if (!['requested', 'pending'].includes(revision.status ?? '')) return false
        if (revision.requested_step_index !== null && message.stage_index !== null) {
            return Number(revision.requested_step_index) === Number(message.stage_index)
        }

        return new Date(revision.created_at).getTime() >= new Date(message.created_at).getTime()
    })
}

export function defaultCreativeStepIndex(order: OrderInfo) {
    const current = order.current_step_index ?? 0
    if (['sketch', 'revision', 'draft', 'add'].includes(order.flow_snapshot[current]?.type))
        return current
    return creativeSteps(order)[0]?.index ?? 0
}

export function attemptText(order: OrderInfo, index: number, step: CommissionStep) {
    const used = order.stage_attempts_used?.[String(index)] ?? 0
    const limit = step.rounds ?? 0
    return limit > 0 ? `${used}/${limit} attempts used` : `${used} attempts used`
}

export function artistUploadTypes(order: OrderInfo | null): UploadType[] {
    const types: UploadType[] = ['image']
    if ((order?.flow_snapshot ?? []).some((step) => step.type === 'sketch')) types.push('sketch')
    if ((order?.flow_snapshot ?? []).some((step) => step.type === 'revision'))
        types.push('revision')
    types.push('final')
    return types
}

export function uploadTypeDescription(type: UploadType) {
    if (type === 'sketch') return 'Submits a sketch and waits for approval or adjustment.'
    if (type === 'revision') return 'Submits a revision and waits for approval or adjustment.'
    if (type === 'final')
        return 'Submits the final art with a watermarked preview and final payment.'
    return 'Sends a normal chat image without changing the commission flow.'
}

export function shouldShowCommissionRequest(order: OrderInfo) {
    return (
        ['requested', 'quoted'].includes(order.status) &&
        Number(order.escrow_credits ?? 0) <= 0 &&
        (order.paid_steps?.length ?? 0) === 0 &&
        !order.final_payment_paid_at
    )
}

export function canArtistManageStage(order: OrderInfo) {
    return order.status === 'in_progress' && !order.archived_at && !order.final_payment_paid_at
}

export function canCancelCommission(order: OrderInfo) {
    return (
        ['requested', 'quoted', 'awaiting_payment', 'in_progress'].includes(order.status) &&
        !order.archived_at
    )
}

export function canArchiveCommission(order: OrderInfo) {
    return order.status === 'completed' && !order.archived_at
}

export function stageStatus(order: OrderInfo) {
    const quotes = order.quotes ?? []
    const latestQuote = quotes.length > 0 ? quotes[quotes.length - 1] : null

    if (latestQuote?.status === 'renegotiation_requested') return 'New quote requested'
    if (latestQuote?.status === 'pending') return 'Waiting for quote response'
    if (latestQuote?.status === 'rejected') return 'Quote rejected'
    if (latestQuote?.status === 'accepted') return 'Quote accepted'

    const step = order.flow_snapshot?.[order.current_step_index]
    return step?.label
        ? `${step.label} · ${order.status.replace('_', ' ')}`
        : order.status.replace('_', ' ')
}
