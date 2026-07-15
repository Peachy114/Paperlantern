import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

interface CommissionApplication {
    id: string
    application_status: ApplicationStatus | 'not_applied'
    commissions_enabled: boolean
    commission_status: 'open' | 'waitlist' | 'closed'
    application_reason: string | null
    customers_count: number
    average_rating: number
    ratings_count: number
    created_at: string
    user: {
        id: string
        name: string
        username: string
        email: string
        avatar: string | null
        artist_title: string | null
        artist_verified: boolean
        works_count: number
        arts_count: number
        created_at: string
    } | null
}

interface CommissionApplicationsResponse {
    applications: {
        data: CommissionApplication[]
    }
    counts: Record<string, number>
}

const FONTS =
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap'

const STATUSES: ApplicationStatus[] = ['pending', 'approved', 'rejected', 'suspended']
const ORDER_STATUSES = ['all', 'requested', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed']

interface AdminCommissionOrder {
    id: string
    status: string
    quote_credits: number
    escrow_credits: number
    released_credits: number
    refunded_credits: number
    request_message: string | null
    auto_release_at: string | null
    created_at: string
    service: { title: string; image_path: string | null } | null
    artist: { name: string; username: string } | null
    customer: { name: string; username: string } | null
}

interface CommissionCategory {
    id: string
    name: string
    slug: string
    sort_order: number
    is_active: boolean
}

interface AdminCommissionRating {
    id: string
    rating: number
    comment: string | null
    status: 'published' | 'appealed' | 'hidden'
    appeal_reason: string | null
    appealed_at: string | null
    service: { title: string } | null
    artist: { name: string; username: string } | null
    customer: { name: string; username: string } | null
}

interface AdminArtistTerms {
    id: string
    terms: string | null
    terms_moderation_status: 'pending' | 'approved' | 'hidden' | 'suspended'
    user: { name: string; username: string; email: string; avatar: string | null } | null
}

interface AdminCommissionMessage {
    id: string
    body: string | null
    image_path: string | null
    image_moderation_status: string
    created_at: string
    sender: { name: string; username: string; avatar: string | null } | null
}

export default function CommissionApplications() {
    const [tab, setTab] = useState<'applications' | 'orders' | 'rating_appeals' | 'artist_terms' | 'terms' | 'categories'>('applications')
    const [status, setStatus] = useState<ApplicationStatus>('pending')
    const [orderStatus, setOrderStatus] = useState('all')
    const [chatOrderId, setChatOrderId] = useState<string | null>(null)
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { data, isLoading } = useQuery<CommissionApplicationsResponse>({
        queryKey: ['admin-commission-applications', status],
        queryFn: () => adminApi.getCommissionApplications(status).then((res) => res.data),
    })

    const applications = data?.applications.data ?? []
    const counts = data?.counts ?? {}

    const { data: orderData, isLoading: ordersLoading } = useQuery<{
        orders: { data: AdminCommissionOrder[] }
        counts: Record<string, number>
    }>({
        queryKey: ['admin-commission-orders', orderStatus],
        queryFn: () => adminApi.getCommissionOrders(orderStatus).then((res) => res.data),
    })

    const orders = orderData?.orders.data ?? []
    const orderCounts = orderData?.counts ?? {}

    const { data: termsData } = useQuery<{ terms: string[] }>({
        queryKey: ['admin-commission-terms'],
        queryFn: () => adminApi.getCommissionTerms().then((res) => res.data),
    })

    const { data: categoryData } = useQuery<{ categories: CommissionCategory[] }>({
        queryKey: ['admin-commission-categories'],
        queryFn: () => adminApi.getCommissionCategories().then((res) => res.data),
    })

    const { data: ratingAppealData, isLoading: ratingAppealsLoading } = useQuery<{
        ratings: { data: AdminCommissionRating[] }
    }>({
        queryKey: ['admin-commission-rating-appeals'],
        queryFn: () => adminApi.getCommissionRatingAppeals().then((res) => res.data),
    })

    const { data: artistTermsData, isLoading: artistTermsLoading } = useQuery<{
        artist_terms: { data: AdminArtistTerms[] }
    }>({
        queryKey: ['admin-commission-artist-terms'],
        queryFn: () => adminApi.getCommissionArtistTerms('pending').then((res) => res.data),
    })

    const { data: chatData, isLoading: chatLoading } = useQuery<{
        messages: AdminCommissionMessage[]
    }>({
        queryKey: ['admin-commission-order-messages', chatOrderId],
        enabled: Boolean(chatOrderId),
        queryFn: () => adminApi.getCommissionOrderMessages(chatOrderId!).then((res) => res.data),
    })

    const action = useMutation({
        mutationFn: ({
            id,
            nextStatus,
        }: {
            id: string
            nextStatus: 'approved' | 'rejected' | 'suspended'
        }) => adminApi.updateCommissionApplication(id, nextStatus).then((res) => res.data),
        onSuccess: (_, variables) => {
            toast.success(`Application ${variables.nextStatus}.`)
            queryClient.invalidateQueries({ queryKey: ['admin-commission-applications'] })
        },
        onError: () => toast.error('Could not update commission application.'),
    })

    const orderAction = useMutation({
        mutationFn: ({ id, nextAction }: { id: string; nextAction: 'release' | 'refund' | 'dispute' }) =>
            adminApi.updateCommissionOrder(id, nextAction).then((res) => res.data),
        onSuccess: (_, variables) => {
            toast.success(`Commission ${variables.nextAction} action saved.`)
            queryClient.invalidateQueries({ queryKey: ['admin-commission-orders'] })
        },
        onError: () => toast.error('Could not update commission order.'),
    })

    const updateTerms = useMutation({
        mutationFn: (terms: string[]) => adminApi.updateCommissionTerms(terms).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission terms updated.')
            queryClient.invalidateQueries({ queryKey: ['admin-commission-terms'] })
        },
        onError: () => toast.error('Could not update commission terms.'),
    })

    const createCategory = useMutation({
        mutationFn: (payload: { name: string; sort_order: number; is_active: boolean }) =>
            adminApi.createCommissionCategory(payload).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission category created.')
            queryClient.invalidateQueries({ queryKey: ['admin-commission-categories'] })
        },
        onError: () => toast.error('Could not create commission category.'),
    })

    const updateCategory = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string
            payload: { name?: string; sort_order?: number; is_active?: boolean }
        }) => adminApi.updateCommissionCategory(id, payload).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission category updated.')
            queryClient.invalidateQueries({ queryKey: ['admin-commission-categories'] })
        },
        onError: () => toast.error('Could not update commission category.'),
    })

    const updateRating = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'published' | 'hidden' }) =>
            adminApi.updateCommissionRating(id, status).then((res) => res.data),
        onSuccess: () => {
            toast.success('Rating appeal updated.')
            queryClient.invalidateQueries({ queryKey: ['admin-commission-rating-appeals'] })
        },
        onError: () => toast.error('Could not update rating appeal.'),
    })

    const updateArtistTerms = useMutation({
        mutationFn: ({
            id,
            terms_moderation_status,
        }: {
            id: string
            terms_moderation_status: 'approved' | 'hidden' | 'suspended'
        }) => adminApi.updateCommissionArtistTerms(id, terms_moderation_status).then((res) => res.data),
        onSuccess: () => {
            toast.success('Artist terms reviewed.')
            queryClient.invalidateQueries({ queryKey: ['admin-commission-artist-terms'] })
        },
        onError: () => toast.error('Could not review artist terms.'),
    })

    const title = useMemo(() => status.toUpperCase(), [status])

    return (
        <>
            <link href={FONTS} rel="stylesheet" />
            <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1
                            className="text-[28px] leading-none tracking-[0.08em] text-foreground"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            COMMISSION APPLICATIONS
                        </h1>
                        <p
                            className="mt-1 text-[12px] text-muted-foreground"
                            style={{ fontFamily: "'Kalam', cursive" }}
                        >
                            Review artists who applied for commission access.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/admin')}>
                        Back to Admin
                    </Button>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                    {(['applications', 'orders', 'rating_appeals', 'artist_terms', 'terms', 'categories'] as const).map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setTab(item)}
                            className={`border-2 px-3 py-1 text-[12px] tracking-[0.12em] ${
                                tab === item
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-foreground/30 bg-background text-muted-foreground hover:text-foreground'
                            }`}
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div
                    className="border-[2.5px] border-foreground bg-[#fffdf5] dark:bg-[#1c1a17]"
                    style={{ boxShadow: '5px 5px 0 var(--foreground)' }}
                >
                    <div className="border-b-[2.5px] border-foreground bg-foreground px-4 py-3">
                        <span
                            className="text-[14px] tracking-[0.16em] text-background"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            {tab === 'applications' ? `${title} APPLICATIONS` : tab.toUpperCase()}
                        </span>
                    </div>

                    {tab === 'applications' && (
                        <>
                            <div className="border-b p-3">
                                <div className="flex flex-wrap gap-2">
                                    {STATUSES.map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setStatus(item)}
                                            className={`border px-3 py-1 text-xs capitalize ${
                                                status === item ? 'bg-foreground text-background' : 'bg-background'
                                            }`}
                                        >
                                            {item} ({counts[item] ?? 0})
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {isLoading ? (
                                <div className="p-10 text-center text-sm text-muted-foreground">Loading...</div>
                            ) : applications.length === 0 ? (
                                <div className="p-10 text-center text-sm text-muted-foreground">
                                    No {status} commission applications.
                                </div>
                            ) : (
                                <div className="divide-y-2 divide-foreground/10">
                                    {applications.map((application, index) => (
                                        <ApplicationRow
                                            key={application.id}
                                            application={application}
                                            index={index}
                                            busy={action.isPending}
                                            onAction={(nextStatus) =>
                                                action.mutate({ id: application.id, nextStatus })
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'orders' && (
                        <>
                            <div className="border-b p-3">
                                <div className="flex flex-wrap gap-2">
                                    {ORDER_STATUSES.map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setOrderStatus(item)}
                                            className={`border px-3 py-1 text-xs capitalize ${
                                                orderStatus === item ? 'bg-foreground text-background' : 'bg-background'
                                            }`}
                                        >
                                            {item} ({item === 'all' ? orders.length : orderCounts[item] ?? 0})
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {ordersLoading ? (
                                <div className="p-10 text-center text-sm text-muted-foreground">Loading orders...</div>
                            ) : orders.length === 0 ? (
                                <div className="p-10 text-center text-sm text-muted-foreground">
                                    No commission orders.
                                </div>
                            ) : (
                                <div className="divide-y-2 divide-foreground/10">
                                    {orders.map((order, index) => (
                                        <OrderRow
                                            key={order.id}
                                            order={order}
                                            index={index}
                                            busy={orderAction.isPending}
                                            onViewMessages={(id) => setChatOrderId(id)}
                                            onAction={(nextAction) =>
                                                orderAction.mutate({ id: order.id, nextAction })
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'terms' && (
                        <TermsEditor
                            terms={termsData?.terms ?? []}
                            busy={updateTerms.isPending}
                            onSave={(terms) => updateTerms.mutate(terms)}
                        />
                    )}

                    {tab === 'rating_appeals' && (
                        <RatingAppeals
                            ratings={ratingAppealData?.ratings.data ?? []}
                            loading={ratingAppealsLoading}
                            busy={updateRating.isPending}
                            onUpdate={(id, status) => updateRating.mutate({ id, status })}
                        />
                    )}

                    {tab === 'artist_terms' && (
                        <ArtistTermsReview
                            items={artistTermsData?.artist_terms.data ?? []}
                            loading={artistTermsLoading}
                            busy={updateArtistTerms.isPending}
                            onUpdate={(id, terms_moderation_status) =>
                                updateArtistTerms.mutate({ id, terms_moderation_status })
                            }
                        />
                    )}

                    {tab === 'categories' && (
                        <CategoriesEditor
                            categories={categoryData?.categories ?? []}
                            busy={createCategory.isPending || updateCategory.isPending}
                            onCreate={(payload) => createCategory.mutate(payload)}
                            onUpdate={(id, payload) => updateCategory.mutate({ id, payload })}
                        />
                    )}
                </div>
            </div>
            <Dialog open={Boolean(chatOrderId)} onOpenChange={(open) => !open && setChatOrderId(null)}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Commission conversation</DialogTitle>
                    </DialogHeader>
                    {chatLoading ? (
                        <div className="p-6 text-sm text-muted-foreground">Loading conversation...</div>
                    ) : (chatData?.messages ?? []).length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">No messages.</div>
                    ) : (
                        <div className="space-y-3">
                            {(chatData?.messages ?? []).map((message) => (
                                <div key={message.id} className="rounded-lg border bg-background p-3">
                                    <div className="text-xs text-muted-foreground">
                                        @{message.sender?.username ?? 'unknown'} · {new Date(message.created_at).toLocaleString()}
                                    </div>
                                    {message.body && (
                                        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                                            {message.body}
                                        </p>
                                    )}
                                    {message.image_path && (
                                        <img
                                            src={storageUrl(message.image_path)!}
                                            alt=""
                                            className="mt-2 max-h-80 rounded-lg object-contain"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

function RatingAppeals({
    ratings,
    loading,
    busy,
    onUpdate,
}: {
    ratings: AdminCommissionRating[]
    loading: boolean
    busy: boolean
    onUpdate: (id: string, status: 'published' | 'hidden') => void
}) {
    if (loading) {
        return <div className="p-10 text-center text-sm text-muted-foreground">Loading rating appeals...</div>
    }

    if (ratings.length === 0) {
        return <div className="p-10 text-center text-sm text-muted-foreground">No rating appeals.</div>
    }

    return (
        <div className="divide-y-2 divide-foreground/10">
            {ratings.map((rating) => (
                <div key={rating.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold">{rating.rating}/5 stars</h2>
                            <span className="border px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                                {rating.status}
                            </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>Artist: @{rating.artist?.username ?? 'unknown'}</span>
                            <span>Customer: @{rating.customer?.username ?? 'unknown'}</span>
                            <span>Service: {rating.service?.title ?? 'Commission'}</span>
                        </div>
                        {rating.comment && (
                            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                                Rating comment: {rating.comment}
                            </p>
                        )}
                        <p className="mt-2 rounded-md bg-muted p-2 text-sm text-muted-foreground">
                            Appeal: {rating.appeal_reason || 'No appeal reason.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col">
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={busy}
                            onClick={() => onUpdate(rating.id, 'hidden')}
                        >
                            Hide rating
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={() => onUpdate(rating.id, 'published')}
                        >
                            Keep rating
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ArtistTermsReview({
    items,
    loading,
    busy,
    onUpdate,
}: {
    items: AdminArtistTerms[]
    loading: boolean
    busy: boolean
    onUpdate: (id: string, status: 'approved' | 'hidden' | 'suspended') => void
}) {
    if (loading) {
        return <div className="p-10 text-center text-sm text-muted-foreground">Loading artist terms...</div>
    }

    if (items.length === 0) {
        return <div className="p-10 text-center text-sm text-muted-foreground">No artist terms pending review.</div>
    }

    return (
        <div className="divide-y-2 divide-foreground/10">
            {items.map((item) => (
                <div key={item.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold">{item.user?.name ?? 'Artist'}</h2>
                            <span className="border px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                                {item.terms_moderation_status}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            @{item.user?.username ?? 'unknown'} · {item.user?.email ?? 'No email'}
                        </p>
                        <p className="mt-3 whitespace-pre-line rounded-md bg-muted p-3 text-sm text-muted-foreground">
                            {item.terms || 'No terms.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col">
                        <Button disabled={busy} onClick={() => onUpdate(item.id, 'approved')}>
                            Approve
                        </Button>
                        <Button variant="outline" disabled={busy} onClick={() => onUpdate(item.id, 'hidden')}>
                            Hide
                        </Button>
                        <Button variant="destructive" disabled={busy} onClick={() => onUpdate(item.id, 'suspended')}>
                            Suspend
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}

function TermsEditor({
    terms,
    busy,
    onSave,
}: {
    terms: string[]
    busy: boolean
    onSave: (terms: string[]) => void
}) {
    const [draft, setDraft] = useState('')

    useEffect(() => {
        setDraft(terms.join('\n'))
    }, [terms])

    const save = () => {
        const lines = draft
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)

        if (lines.length === 0) {
            toast.error('Add at least one commission term.')
            return
        }

        onSave(lines)
    }

    return (
        <div className="p-4">
            <div className="mb-3">
                <h2 className="font-semibold">Platform commission terms</h2>
                <p className="text-sm text-muted-foreground">
                    One term per line. These apply above artist terms.
                </p>
            </div>
            <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-56 w-full rounded-lg border bg-background p-3 text-sm"
            />
            <Button className="mt-3" disabled={busy} onClick={save}>
                Save terms
            </Button>
        </div>
    )
}

function CategoriesEditor({
    categories,
    busy,
    onCreate,
    onUpdate,
}: {
    categories: CommissionCategory[]
    busy: boolean
    onCreate: (payload: { name: string; sort_order: number; is_active: boolean }) => void
    onUpdate: (id: string, payload: { name?: string; sort_order?: number; is_active?: boolean }) => void
}) {
    const [name, setName] = useState('')
    const [sortOrder, setSortOrder] = useState(0)

    const add = () => {
        if (!name.trim()) {
            toast.error('Category name is required.')
            return
        }
        onCreate({ name: name.trim(), sort_order: sortOrder, is_active: true })
        setName('')
        setSortOrder(0)
    }

    return (
        <div className="p-4">
            <div className="mb-3">
                <h2 className="font-semibold">Commission categories</h2>
                <p className="text-sm text-muted-foreground">Control categories shown in public Commission browse.</p>
            </div>
            <div className="mb-4 grid gap-2 md:grid-cols-[1fr_120px_auto]">
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Category name"
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                />
                <input
                    type="number"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(Number(event.target.value))}
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                />
                <Button disabled={busy} onClick={add}>
                    Add category
                </Button>
            </div>
            <div className="divide-y rounded-lg border bg-background">
                {categories.map((category) => (
                    <div key={category.id} className="grid gap-2 p-3 md:grid-cols-[1fr_110px_120px]">
                        <input
                            defaultValue={category.name}
                            onBlur={(event) =>
                                event.target.value !== category.name &&
                                onUpdate(category.id, { name: event.target.value })
                            }
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                        />
                        <input
                            type="number"
                            defaultValue={category.sort_order}
                            onBlur={(event) =>
                                Number(event.target.value) !== category.sort_order &&
                                onUpdate(category.id, { sort_order: Number(event.target.value) })
                            }
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                defaultChecked={category.is_active}
                                onChange={(event) =>
                                    onUpdate(category.id, { is_active: event.target.checked })
                                }
                            />
                            Active
                        </label>
                    </div>
                ))}
            </div>
        </div>
    )
}

function OrderRow({
    order,
    index,
    busy,
    onViewMessages,
    onAction,
}: {
    order: AdminCommissionOrder
    index: number
    busy: boolean
    onViewMessages: (id: string) => void
    onAction: (action: 'release' | 'refund' | 'dispute') => void
}) {
    return (
        <div
            className={`grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] ${
                index % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'
            }`}
        >
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{order.service?.title ?? 'Commission order'}</h2>
                    <span className="border px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                        {order.status.replace('_', ' ')}
                    </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Artist: {order.artist?.name ?? 'Unknown'}</span>
                    <span>Customer: {order.customer?.name ?? 'Unknown'}</span>
                    <span>Quote {order.quote_credits}</span>
                    <span>Escrow {order.escrow_credits}</span>
                    <span>Released {order.released_credits}</span>
                    <span>Refunded {order.refunded_credits}</span>
                </div>
                <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                    {order.request_message || 'No request message.'}
                </p>
                {order.auto_release_at && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Auto-release: {new Date(order.auto_release_at).toLocaleString()}
                    </p>
                )}
            </div>
            <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col">
                <Button
                    type="button"
                    className="w-full"
                    disabled={busy || order.status === 'completed'}
                    onClick={() => onAction('release')}
                >
                    Release
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={busy || order.status === 'cancelled'}
                    onClick={() => onAction('refund')}
                >
                    Refund
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    disabled={busy || order.status === 'disputed'}
                    onClick={() => onAction('dispute')}
                >
                    Dispute
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => onViewMessages(order.id)}>
                    View chat
                </Button>
            </div>
        </div>
    )
}

function ApplicationRow({
    application,
    index,
    busy,
    onAction,
}: {
    application: CommissionApplication
    index: number
    busy: boolean
    onAction: (status: 'approved' | 'rejected' | 'suspended') => void
}) {
    const user = application.user

    return (
        <div
            className={`grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] ${
                index % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'
            }`}
        >
            <div className="min-w-0">
                <div className="flex flex-wrap items-start gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden border-2 border-foreground bg-foreground text-background">
                        {user?.avatar ? (
                            <img
                                src={storageUrl(user.avatar)!}
                                alt={user.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span
                                className="flex h-full w-full items-center justify-center text-[18px]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                {user?.name?.[0]?.toUpperCase() ?? 'A'}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2
                                className="text-[20px] leading-none tracking-[0.06em]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                {user?.name ?? 'Unknown artist'}
                            </h2>
                            {user?.artist_verified && (
                                <span className="bg-sky-100 px-2 py-0.5 text-[10px] text-sky-700">
                                    VERIFIED
                                </span>
                            )}
                            <span className="border px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                                {application.application_status.replace('_', ' ')}
                            </span>
                        </div>
                        <div
                            className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground"
                            style={{ fontFamily: "'Kalam', cursive" }}
                        >
                            <span>@{user?.username ?? 'unknown'}</span>
                            <span>{user?.email ?? 'No email'}</span>
                            <span>{user?.works_count ?? 0} works</span>
                            <span>{user?.arts_count ?? 0} arts</span>
                            <span>{application.customers_count} commission customers</span>
                            <span>
                                {application.ratings_count > 0
                                    ? `${application.average_rating.toFixed(1)} rating`
                                    : 'No commission ratings'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-lg border bg-background/70 p-3">
                    <p
                        className="mb-1 text-[11px] tracking-[0.12em] text-muted-foreground"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        WHY THEY APPLIED
                    </p>
                    <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {application.application_reason || 'No reason provided.'}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-start gap-2 lg:w-48 lg:flex-col">
                <Button
                    type="button"
                    className="w-full"
                    disabled={busy || application.application_status === 'approved'}
                    onClick={() => onAction('approved')}
                >
                    Approve
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={busy || application.application_status === 'rejected'}
                    onClick={() => onAction('rejected')}
                >
                    Reject
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    disabled={busy || application.application_status === 'suspended'}
                    onClick={() => onAction('suspended')}
                >
                    Suspend
                </Button>
            </div>
        </div>
    )
}
