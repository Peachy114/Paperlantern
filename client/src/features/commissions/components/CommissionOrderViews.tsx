import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import ViewProfileLink from '@/components/profile/ViewProfileLink'
import type {
    CommissionOrder,
    CommissionRating,
} from '@/features/commissions/types/studioCommission'

// Commission orders and ratings ----
export function CommissionRequestsSection({ orders }: { orders: CommissionOrder[] }) {
    const navigate = useNavigate()
    const [requestTab, setRequestTab] = useState<'requests' | 'completed'>('requests')
    const visibleOrders = orders.filter((order) =>
        requestTab === 'completed' ? order.status === 'completed' : order.status !== 'completed'
    )

    return (
        <section className="rounded-[24px] border border-border bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4">
                <h2 className="text-base font-semibold">Commission requests</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Review request names, wanderers, quotes, paid credits, and pending balance.
                </p>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant={requestTab === 'requests' ? 'default' : 'outline'}
                    onClick={() => setRequestTab('requests')}
                >
                    Requests
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={requestTab === 'completed' ? 'default' : 'outline'}
                    onClick={() => setRequestTab('completed')}
                >
                    Completed
                </Button>
            </div>
            {orders.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No commission requests yet.
                </div>
            ) : visibleOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No {requestTab === 'completed' ? 'completed commissions' : 'active requests'}{' '}
                    yet.
                </div>
            ) : (
                <div className="grid gap-3">
                    {visibleOrders.map((order) => {
                        const paidCredits =
                            Number(order.escrow_credits || 0) + Number(order.released_credits || 0)
                        const pendingCredits = Math.max(
                            0,
                            Number(order.quote_credits || 0) - paidCredits
                        )

                        return (
                            <div
                                key={order.id}
                                className="overflow-hidden rounded-lg border bg-background transition focus-within:border-primary/40 hover:border-primary/40"
                            >
                                <button
                                    type="button"
                                    onClick={() => navigate(`/messages?order=${order.id}`)}
                                    className="w-full p-3 text-left transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                >
                                    <div className="min-w-0">
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Request commission name
                                                </p>
                                                <h3 className="font-semibold">
                                                    {order.service?.title ?? 'Commission service'}
                                                </h3>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Name</p>
                                                <p className="font-medium">
                                                    {order.customer?.name ?? 'Wanderer'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    How much total
                                                </p>
                                                <p className="font-medium">
                                                    {Number(order.quote_credits || 0).toFixed(2)}{' '}
                                                    quote
                                                    <span className="text-muted-foreground">
                                                        {' '}
                                                        ({paidCredits.toFixed(2)} paid -{' '}
                                                        {pendingCredits.toFixed(2)} pending)
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span className="rounded-md border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            From {order.customer?.name ?? 'Wanderer'} · Quote{' '}
                                            {order.quote_credits} credits · Escrow{' '}
                                            {order.escrow_credits} credits
                                        </p>
                                        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                                            {order.request_message}
                                        </p>
                                        {order.reference_notes && (
                                            <p className="mt-2 whitespace-pre-line rounded-md bg-muted p-2 text-xs text-muted-foreground">
                                                {order.reference_notes}
                                            </p>
                                        )}
                                        {order.auto_release_at && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Auto-release review date:{' '}
                                                {new Date(order.auto_release_at).toLocaleString()}
                                            </p>
                                        )}
                                        {order.payment_due_at && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Payment due:{' '}
                                                {new Date(order.payment_due_at).toLocaleString()}
                                            </p>
                                        )}
                                        {order.flow_snapshot.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {order.flow_snapshot.map((step, index) => (
                                                    <span
                                                        key={`${step.label}-${index}`}
                                                        className={`rounded-md border px-2 py-1 text-[11px] ${
                                                            index === order.current_step_index
                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {step.label}
                                                        {step.type === 'pay' &&
                                                        order.paid_steps.includes(index)
                                                            ? ' paid'
                                                            : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {order.revisions.length > 0 && (
                                            <div className="mt-3 rounded-md border p-2">
                                                <p className="text-xs font-medium">
                                                    Revision requests
                                                </p>
                                                <div className="mt-2 space-y-2">
                                                    {order.revisions.map((revision) => (
                                                        <div
                                                            key={revision.id}
                                                            className="rounded-md bg-muted p-2 text-xs text-muted-foreground"
                                                        >
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span>
                                                                    #{revision.revision_number}
                                                                </span>
                                                                <span className="capitalize">
                                                                    {revision.status}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 whitespace-pre-line">
                                                                {revision.reason}
                                                            </p>
                                                            {revision.artist_response && (
                                                                <p className="mt-2 whitespace-pre-line rounded bg-background p-2">
                                                                    {revision.artist_response}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {order.delivery_files.length > 0 && (
                                            <div className="mt-3 rounded-md border p-2 text-xs text-muted-foreground">
                                                <p className="font-medium text-foreground">
                                                    Final delivery files
                                                </p>
                                                {order.delivery_files.map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="mt-1 flex flex-wrap gap-2"
                                                    >
                                                        <span>
                                                            {file.original_name ?? 'Delivery file'}
                                                        </span>
                                                        <span className="capitalize">
                                                            ({file.moderation_status})
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </button>

                                <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/10 px-3 py-2">
                                    <span className="text-xs text-muted-foreground">
                                        {order.customer?.username
                                            ? `@${order.customer.username}`
                                            : 'Wanderer profile'}
                                    </span>
                                    <ViewProfileLink
                                        username={order.customer?.username}
                                        role="wanderer"
                                        compact
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export function CommissionRatingsSection({
    ratings,
    busy,
    onAppeal,
}: {
    ratings: CommissionRating[]
    busy: boolean
    onAppeal: (id: string, appeal_reason: string) => void
}) {
    const [appeal, setAppeal] = useState<CommissionRating | null>(null)
    const [reason, setReason] = useState('')

    const submit = () => {
        if (!appeal) return
        if (reason.trim().length < 10) {
            toast.error('Appeal reason must be at least 10 characters.')
            return
        }
        onAppeal(appeal.id, reason.trim())
        setAppeal(null)
        setReason('')
    }

    return (
        <section className="mt-5 rounded-xl border bg-background p-4">
            <div className="mb-4">
                <h2 className="text-base font-semibold">Commission ratings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Ratings are public after completed commissions. You can appeal invalid ratings.
                </p>
            </div>
            {ratings.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No commission ratings yet.
                </div>
            ) : (
                <div className="grid gap-3">
                    {ratings.map((rating) => (
                        <div key={rating.id} className="rounded-lg border p-3">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold">
                                            {rating.rating}/5 stars
                                        </span>
                                        <span className="rounded-md border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                            {rating.status}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <p className="text-xs text-muted-foreground">
                                            From {rating.customer?.name ?? 'Wanderer'} ·{' '}
                                            {rating.service?.title ?? 'Commission'}
                                        </p>
                                        <ViewProfileLink
                                            username={rating.customer?.username}
                                            role="wanderer"
                                            compact
                                        />
                                    </div>
                                    {rating.comment && (
                                        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                                            {rating.comment}
                                        </p>
                                    )}
                                    {rating.appeal_reason && (
                                        <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                                            Appeal: {rating.appeal_reason}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy || rating.status !== 'published'}
                                    onClick={() => setAppeal(rating)}
                                >
                                    Appeal
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={Boolean(appeal)} onOpenChange={(open) => !open && setAppeal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Appeal rating</DialogTitle>
                        <DialogDescription>
                            Tell admin why this rating is invalid or abusive.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        className="min-h-32"
                        placeholder="Explain the issue with this rating."
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAppeal(null)}>
                            Cancel
                        </Button>
                        <Button disabled={busy} onClick={submit}>
                            Send appeal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

void CommissionRatingsSection

export function CommissionRatingsSectionV2({
    ratings,
    busy,
    onAppeal,
}: {
    ratings: CommissionRating[]
    busy: boolean
    onAppeal: (id: string, appeal_reason: string) => void
}) {
    const [appeal, setAppeal] = useState<CommissionRating | null>(null)
    const [reason, setReason] = useState('')

    const submit = () => {
        if (!appeal) return
        if (reason.trim().length < 10) {
            toast.error('Appeal reason must be at least 10 characters.')
            return
        }
        onAppeal(appeal.id, reason.trim())
        setAppeal(null)
        setReason('')
    }

    return (
        <section className="rounded-[24px] border border-border bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4">
                <h2 className="text-base font-semibold">Commission ratings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Ratings are public after completed commissions. You can appeal invalid ratings.
                </p>
            </div>
            {ratings.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No commission ratings yet.
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <div className="grid gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground md:grid-cols-[140px_220px_1fr_100px]">
                        <span>Stars</span>
                        <span>Wanderer name</span>
                        <span>Description</span>
                        <span />
                    </div>
                    {ratings.map((rating) => (
                        <div
                            key={rating.id}
                            className="grid gap-3 border-b px-3 py-3 last:border-b-0 md:grid-cols-[140px_220px_1fr_100px]"
                        >
                            <div>
                                <p className="font-semibold">{rating.rating}/5 stars</p>
                                <p className="mt-1 text-xs capitalize text-muted-foreground">
                                    {rating.status}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium">
                                    {rating.customer?.name ?? 'Wanderer'}
                                </p>
                                <ViewProfileLink
                                    username={rating.customer?.username}
                                    role="wanderer"
                                    compact
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <p className="whitespace-pre-line text-sm text-muted-foreground">
                                    {rating.comment || 'No description.'}
                                </p>
                                {rating.appeal_reason && (
                                    <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                                        Appeal: {rating.appeal_reason}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy || rating.status !== 'published'}
                                    onClick={() => setAppeal(rating)}
                                >
                                    Appeal
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={Boolean(appeal)} onOpenChange={(open) => !open && setAppeal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Appeal rating</DialogTitle>
                        <DialogDescription>
                            Tell admin why this rating is invalid or abusive.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        className="min-h-32"
                        placeholder="Explain the issue with this rating."
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAppeal(null)}>
                            Cancel
                        </Button>
                        <Button disabled={busy} onClick={submit}>
                            Send appeal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}
