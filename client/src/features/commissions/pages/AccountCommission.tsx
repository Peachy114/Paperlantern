import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'
import ArtistCommission from './MyCommission'
import { commissionApi } from '@/api/commissions'
import { useAuthStore } from '@/store/authStore'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface AccountOrder {
    id: string
    status: string
    request_message: string | null
    reference_notes: string | null
    quote_credits: number
    quote_note: string | null
    escrow_credits: number
    released_credits: number
    refunded_credits: number
    flow_snapshot: Array<{ type: string; label: string; percent?: number; rounds?: number }>
    paid_steps: number[]
    current_step_index: number
    revision_limit: number
    revisions: Array<{
        id: string
        reason: string
        revision_number: number
        status: string
        artist_response: string | null
        created_at: string
    }>
    delivery_files: Array<{
        id: string
        file_path: string
        preview_path?: string | null
        original_name: string | null
        note: string | null
        moderation_status: string
        created_at: string
    }>
    auto_release_at: string | null
    payment_due_at: string | null
    quote_accepted_at: string | null
    created_at: string
    service: {
        title: string
        slug: string
        image_path: string | null
        delivery_days: number | null
    } | null
    artist: {
        name: string
        username: string
        avatar: string | null
        artist_verified: boolean
    } | null
}

export default function AccountCommission() {
    const user = useAuthStore((state) => state.user)

    if (user?.role === 'storyteller') {
        return <ArtistCommission />
    }

    return <WandererCommission />
}

function WandererCommission() {
    const queryClient = useQueryClient()
    const [ratingOrder, setRatingOrder] = useState<AccountOrder | null>(null)
    const [revisionOrder, setRevisionOrder] = useState<AccountOrder | null>(null)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [revisionReason, setRevisionReason] = useState('')
    const { data, isLoading } = useQuery<{ orders: { data: AccountOrder[] } }>({
        queryKey: ['account-commission-orders'],
        queryFn: () => commissionApi.getAccountOrders().then((res) => res.data),
    })

    const orders = data?.orders.data ?? []

    const rate = useMutation({
        mutationFn: () =>
            commissionApi
                .rateOrder(ratingOrder!.id, { rating, comment: comment.trim() || undefined })
                .then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission rating saved.')
            setRatingOrder(null)
            setComment('')
            setRating(5)
            queryClient.invalidateQueries({ queryKey: ['account-commission-orders'] })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not save rating.'),
    })

    const requestRevision = useMutation({
        mutationFn: () => commissionApi.requestRevision(revisionOrder!.id, { reason: revisionReason }).then((res) => res.data),
        onSuccess: () => {
            toast.success('Revision requested.')
            setRevisionOrder(null)
            setRevisionReason('')
            queryClient.invalidateQueries({ queryKey: ['account-commission-orders'] })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not request revision.'),
    })

    return (
        <div className="rounded-3xl border bg-muted/30 p-5">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Commission</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Track your commission requests, messages, delivery review, escrow release, and refunds.
                </p>
            </div>

            {isLoading ? (
                <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
                    Loading commissions...
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-background p-10 text-center">
                    <p className="font-medium">No commission requests yet.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Browse Commissions, pick an artist service, and your request will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {orders.map((order) => (
                        <div key={order.id} className="rounded-xl border bg-background p-4">
                            <div className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)_auto]">
                                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                                    {order.service?.image_path ? (
                                        <img
                                            src={storageUrl(order.service.image_path)!}
                                            alt={order.service.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : null}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold">{order.service?.title ?? 'Commission'}</h2>
                                        <span className="rounded-md border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Artist: {order.artist?.name ?? 'Unknown'} · Quote {order.quote_credits} credits · Escrow {order.escrow_credits} credits
                                    </p>
                                    {order.quote_note && (
                                        <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                                            Quote note: {order.quote_note}
                                        </p>
                                    )}
                                    <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                                        {order.request_message}
                                    </p>
                                    {order.auto_release_at && (
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Auto-release after: {new Date(order.auto_release_at).toLocaleString()}
                                        </p>
                                    )}
                                    {order.payment_due_at && (
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Payment due: {new Date(order.payment_due_at).toLocaleString()}
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
                                                    {step.type === 'pay' && order.paid_steps.includes(index) ? ' paid' : ''}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {order.revisions.length > 0 && (
                                        <div className="mt-3 rounded-md border p-2 text-xs text-muted-foreground">
                                            <p className="font-medium text-foreground">
                                                Revisions {order.revisions.length}/{order.revision_limit || 'unlimited'}
                                            </p>
                                            {order.revisions.map((revision) => (
                                                <div key={revision.id} className="mt-2 rounded-md bg-muted p-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        <span>#{revision.revision_number}</span>
                                                        <span className="capitalize">{revision.status}</span>
                                                    </div>
                                                    <p className="mt-1 whitespace-pre-line">{revision.reason}</p>
                                                    {revision.artist_response && (
                                                        <p className="mt-1 whitespace-pre-line">
                                                            Artist: {revision.artist_response}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {order.delivery_files.length > 0 && (
                                        <div className="mt-3 rounded-md border p-2 text-xs text-muted-foreground">
                                            <p className="font-medium text-foreground">Final delivery files</p>
                                            {order.delivery_files.map((file) => (
                                                <a
                                                    key={file.id}
                                                    href={storageUrl(file.file_path)!}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-1 block underline"
                                                >
                                                    {file.original_name ?? 'Delivery file'} ({file.moderation_status})
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 md:w-44 md:flex-col">
                                    <Button asChild size="sm">
                                        <a href={`/messages?order=${order.id}`}>
                                            <MessageCircle className="mr-1 h-4 w-4" />
                                            Open messages
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={Boolean(ratingOrder)} onOpenChange={(open) => !open && setRatingOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rate commission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium">Rating</label>
                            <select
                                value={rating}
                                onChange={(event) => setRating(Number(event.target.value))}
                                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                {[5, 4, 3, 2, 1].map((value) => (
                                    <option key={value} value={value}>
                                        {value} star{value > 1 ? 's' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Comment</label>
                            <Textarea
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                                placeholder="Share your experience with this artist."
                                className="mt-1 min-h-28"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRatingOrder(null)}>
                            Cancel
                        </Button>
                        <Button disabled={rate.isPending} onClick={() => rate.mutate()}>
                            Save rating
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={Boolean(revisionOrder)} onOpenChange={(open) => !open && setRevisionOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Used {revisionOrder?.revisions.length ?? 0} of {revisionOrder?.revision_limit || 'unlimited'} revision rounds.
                        </p>
                        <Textarea
                            value={revisionReason}
                            onChange={(event) => setRevisionReason(event.target.value)}
                            className="min-h-32"
                            placeholder="Explain what needs to be revised."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevisionOrder(null)}>
                            Cancel
                        </Button>
                        <Button disabled={requestRevision.isPending} onClick={() => requestRevision.mutate()}>
                            Send request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
