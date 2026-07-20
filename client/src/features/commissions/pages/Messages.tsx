import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Download, Flag, ImagePlus, Info, MoreHorizontal, Send, Settings } from 'lucide-react'
import { commissionApi } from '@/api/commissions'
import { studioApi } from '@/api/studio'
import { useAuthStore } from '@/store/authStore'
import { storageUrl } from '@/utils/storage'
import type { RoyaltyDesignAsset } from '@/types/artistProfile'
import { RoyaltyMessageBubble, royaltyMessageBackgroundStyle } from '@/components/royalty/RoyaltyDesignRenderer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type UploadType = 'image' | 'sketch' | 'revision' | 'final'

interface Thread {
    id: string
    status: string
    quote_credits: number
    escrow_credits: number
    unread_count: number
    service: { title: string; image_path: string | null } | null
    other_user: { name: string; username: string; avatar: string | null; artist_verified: boolean } | null
    last_message: Message | null
}

interface Message {
    id: string
    body: string | null
    kind: 'message' | 'stage_submission' | 'final_delivery'
    upload_type: UploadType | null
    stage_index: number | null
    approval_status: 'pending' | 'approved' | 'adjustment' | null
    delivery_file: DeliveryFile | null
    image_path: string | null
    image_moderation_status?: string
    read_by_recipient: boolean
    created_at: string
    sender: { id: string; name: string; username: string; avatar: string | null } | null
}

interface DeliveryFile {
    id: string
    file_path: string
    preview_path?: string | null
    original_name: string | null
    moderation_status: string
}

interface CommissionStep {
    type: string
    label: string
    percent?: number
    rounds?: number
}

interface OrderInfo {
    id: string
    status: string
    quote_credits: number
    quote_note: string | null
    escrow_credits: number
    released_credits: number
    refunded_credits: number
    request_message: string | null
    reference_notes: string | null
    request_answers?: { question_id?: string; question?: string; answer?: string }[]
    client_details?: Record<string, string>
    flow_snapshot: CommissionStep[]
    paid_steps: number[]
    stage_attempts_used: Record<string, number>
    current_step_index: number
    auto_release_at: string | null
    payment_due_at: string | null
    final_payment_paid_at: string | null
    final_payment_due_credits: number
    extra_attempt_credits: number
    archived_at: string | null
    revisions: CommissionRevision[]
    service: { title: string; image_path: string | null } | null
    artist?: { id: string; name: string; username: string } | null
    customer?: { id: string; name: string; username: string } | null
}

interface CommissionRevision {
    id: string
    reason: string
    revision_number: number
    requested_step_index: number | null
    requested_step_type: string | null
    extra_attempt_credits: number
    status: string
    created_at: string
    requester: { id: string; name: string; username: string; avatar: string | null } | null
}

interface MessagePreferences {
    message_read_receipts_enabled: boolean
    message_design_id: string | null
    message_background_id: string | null
}

interface MessagePreferenceResponse {
    preferences: MessagePreferences
    message_designs: RoyaltyDesignAsset[]
    message_backgrounds: RoyaltyDesignAsset[]
}

interface MessagePagination {
    has_more: boolean
    next_before: string | null
    limit: number
}

interface MessageResponse {
    order: OrderInfo
    messages: Message[]
    pagination: MessagePagination
}

export default function Messages() {
    const [searchParams, setSearchParams] = useSearchParams()
    const requestedOrder = searchParams.get('order')
    const [selectedId, setSelectedId] = useState<string | null>(requestedOrder)
    const [body, setBody] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [uploadType, setUploadType] = useState<UploadType>('image')
    const [infoOpen, setInfoOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [quoteOpen, setQuoteOpen] = useState(false)
    const [stageOpen, setStageOpen] = useState(false)
    const [revisionOpen, setRevisionOpen] = useState(false)
    const [extraAttemptOpen, setExtraAttemptOpen] = useState(false)
    const [uploadTypeOpen, setUploadTypeOpen] = useState(false)
    const [actionMenuOpen, setActionMenuOpen] = useState(false)
    const [imagePreview, setImagePreview] = useState<{ src: string; title: string } | null>(null)
    const [quoteCredits, setQuoteCredits] = useState(0)
    const [quoteNote, setQuoteNote] = useState('')
    const [stageIndex, setStageIndex] = useState(0)
    const [stageNote, setStageNote] = useState('')
    const [revisionReason, setRevisionReason] = useState('')
    const [revisionStepIndex, setRevisionStepIndex] = useState(0)
    const user = useAuthStore((state) => state.user)
    const queryClient = useQueryClient()

    const { data: threadData, isLoading } = useQuery<{ threads: { data: Thread[] }; preferences: MessagePreferences }>({
        queryKey: ['commission-message-threads'],
        queryFn: () => commissionApi.getMessageThreads().then((res) => res.data),
    })

    const { data: preferenceData } = useQuery<MessagePreferenceResponse>({
        queryKey: ['message-preferences'],
        queryFn: () => commissionApi.getMessagePreferences().then((res) => res.data),
    })

    const threads = threadData?.threads.data ?? []
    const preferences = preferenceData?.preferences ?? threadData?.preferences ?? {
        message_read_receipts_enabled: true,
        message_design_id: null,
        message_background_id: null,
    }
    const firstThreadId = threads[0]?.id ?? null

    useEffect(() => {
        if (!selectedId && firstThreadId) setSelectedId(firstThreadId)
    }, [firstThreadId, selectedId])

    const { data: messageData } = useQuery<MessageResponse>({
        queryKey: ['commission-messages', selectedId],
        enabled: Boolean(selectedId),
        queryFn: () => commissionApi.getMessages(selectedId!).then((res) => res.data),
    })

    const selectedThread = useMemo(
        () => threads.find((thread) => thread.id === selectedId) ?? null,
        [threads, selectedId]
    )
    const messages = messageData?.messages ?? []
    const order = messageData?.order ?? null
    const isArtist = Boolean(order?.artist?.id && order.artist.id === user?.id)
    const selectedBackground = preferenceData?.message_backgrounds.find((asset) => asset.id === preferences.message_background_id) ?? null
    const selectedDesign = preferenceData?.message_designs.find((asset) => asset.id === preferences.message_design_id) ?? null
    const visibleRevisions = useMemo(
        () => visibleRevisionItems(order?.revisions ?? [], messages, Boolean(messageData?.pagination?.has_more)),
        [order?.revisions, messages, messageData?.pagination?.has_more]
    )
    const timeline = useMemo(() => buildTimeline(messages, visibleRevisions), [messages, visibleRevisions])

    useEffect(() => {
        if (!order) return
        setQuoteCredits(order.quote_credits || 0)
        setQuoteNote(order.quote_note || '')
        setStageIndex(order.current_step_index || 0)
        setRevisionStepIndex(defaultCreativeStepIndex(order))
    }, [order?.id, order?.quote_credits, order?.quote_note, order?.current_step_index])

    const refreshMessages = () => {
        queryClient.invalidateQueries({ queryKey: ['commission-messages', selectedId] })
        queryClient.invalidateQueries({ queryKey: ['commission-message-threads'] })
    }

    const loadOlderMessages = useMutation({
        mutationFn: () => commissionApi.getMessages(selectedId!, { before: messageData?.pagination?.next_before }).then((res) => res.data as MessageResponse),
        onSuccess: (olderData) => {
            queryClient.setQueryData<MessageResponse>(['commission-messages', selectedId], (current) => {
                if (!current) return olderData
                return {
                    ...current,
                    order: olderData.order,
                    messages: mergeMessages(olderData.messages, current.messages),
                    pagination: olderData.pagination,
                }
            })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not load older messages.'),
    })

    const sendMessage = useMutation({
        mutationFn: () => {
            const payload = new FormData()
            payload.append('body', body.trim())
            if (image) payload.append('image', image)
            if (image && isArtist) payload.append('upload_type', uploadType)
            return commissionApi.sendMessage(selectedId!, payload).then((res) => res.data)
        },
        onSuccess: () => {
            setBody('')
            setImage(null)
            setUploadType('image')
            refreshMessages()
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not send message.'),
    })

    const savePreferences = useMutation({
        mutationFn: (payload: MessagePreferences) => commissionApi.updateMessagePreferences(payload).then((res) => res.data),
        onSuccess: () => {
            toast.success('Message settings saved.')
            queryClient.invalidateQueries({ queryKey: ['message-preferences'] })
            setSettingsOpen(false)
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not save message settings.'),
    })

    const quoteOrder = useMutation({
        mutationFn: () =>
            studioApi.quoteCommissionOrder(order!.id, {
                quote_credits: quoteCredits,
                quote_note: quoteNote.trim() || undefined,
                flow: order?.flow_snapshot ?? [],
            }).then((res) => res.data),
        onSuccess: () => {
            toast.success('Quote sent.')
            setQuoteOpen(false)
            refreshMessages()
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not send quote.'),
    })

    const artistUpdate = useMutation({
        mutationFn: (status: 'in_progress' | 'delivered' | 'cancelled' | 'disputed') =>
            studioApi.updateCommissionOrder(order!.id, { status }).then((res) => res.data),
        onSuccess: () => refreshMessages(),
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not update commission.'),
    })

    const customerUpdate = useMutation({
        mutationFn: (action: 'cancel' | 'dispute') => commissionApi.updateAccountOrder(order!.id, action).then((res) => res.data),
        onSuccess: () => refreshMessages(),
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not update commission.'),
    })

    const acceptQuote = useMutation({
        mutationFn: () => commissionApi.acceptQuote(order!.id).then((res) => res.data),
        onSuccess: () => {
            toast.success('Quote accepted.')
            refreshMessages()
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not accept quote.'),
    })

    const payFinalDelivery = useMutation({
        mutationFn: () => commissionApi.payFinalDelivery(order!.id).then((res) => res.data),
        onSuccess: (data) => {
            toast.success(data?.message ?? 'Final delivery paid.')
            refreshMessages()
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not pay final delivery.'),
    })

    const requestRevision = useMutation({
        mutationFn: (payExtra: boolean = false) => commissionApi.requestRevision(order!.id, {
            reason: revisionReason,
            step_index: revisionStepIndex,
            pay_extra: payExtra,
        }).then((res) => res.data),
        onSuccess: () => {
            toast.success('Adjustment requested.')
            setRevisionOpen(false)
            setExtraAttemptOpen(false)
            setRevisionReason('')
            refreshMessages()
        },
        onError: (error: any) => {
            if (error?.response?.status === 402) {
                setRevisionOpen(false)
                setExtraAttemptOpen(true)
                return
            }
            toast.error(error?.response?.data?.message ?? 'Could not request adjustment.')
        },
    })

    const advanceStage = useMutation({
        mutationFn: () =>
            studioApi.advanceCommissionStage(order!.id, {
                step_index: stageIndex,
                note: stageNote.trim() || undefined,
            }).then((res) => res.data),
        onSuccess: () => {
            toast.success('Stage updated.')
            setStageOpen(false)
            setStageNote('')
            refreshMessages()
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not update stage.'),
    })

    const archiveOrder = useMutation({
        mutationFn: () => studioApi.archiveCommissionOrder(order!.id).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission archived.')
            refreshMessages()
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not archive commission.'),
    })

    const approveSubmission = useMutation({
        mutationFn: (messageId: string) => commissionApi.approveSubmission(messageId).then((res) => res.data),
        onSuccess: () => {
            toast.success('Submission approved.')
            refreshMessages()
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not approve submission.'),
    })

    const selectThread = (id: string) => {
        setSelectedId(id)
        setSearchParams({ order: id })
        commissionApi.markMessagesRead(id).finally(() => {
            queryClient.invalidateQueries({ queryKey: ['commission-message-threads'] })
        })
    }

    const attachImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        setImage(file)
        if (file && isArtist) setUploadTypeOpen(true)
    }

    return (
        <div className="rounded-3xl border bg-muted/30 p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Commission conversations with text, images, request information, and delivery stages.
                    </p>
                </div>
                <Button type="button" variant="outline" onClick={() => setSettingsOpen(true)}>
                    <Settings className="mr-1 h-4 w-4" />
                    Settings
                </Button>
            </div>

            <div className="grid h-[72dvh] min-h-[560px] overflow-hidden rounded-xl border bg-background lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="min-h-0 overflow-y-auto border-b lg:border-r lg:border-b-0">
                    {isLoading ? (
                        <div className="p-4 text-sm text-muted-foreground">Loading messages...</div>
                    ) : threads.length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">No commission messages yet.</div>
                    ) : (
                        <div className="divide-y">
                            {threads.map((thread) => (
                                <button
                                    key={thread.id}
                                    type="button"
                                    onClick={() => selectThread(thread.id)}
                                    className={`flex w-full gap-3 p-3 text-left transition ${selectedId === thread.id ? 'bg-muted' : 'hover:bg-muted/60'}`}
                                >
                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                        {thread.service?.image_path && (
                                            <img src={storageUrl(thread.service.image_path)!} alt="" className="h-full w-full object-cover" />
                                        )}
                                        {thread.unread_count > 0 && (
                                            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold">{thread.service?.title ?? 'Commission'}</div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {thread.other_user?.name ?? 'User'} · {thread.status.replace('_', ' ')}
                                        </div>
                                        <div className="mt-1 truncate text-xs text-muted-foreground">
                                            {thread.last_message?.body || (thread.last_message?.image_path ? 'Image' : 'No messages yet')}
                                        </div>
                                    </div>
                                    {thread.unread_count > 0 && (
                                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                            {thread.unread_count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                <section className="flex min-h-0 flex-col">
                    {selectedThread ? (
                        <>
                            <header className="border-b">
                                <div className="flex items-center justify-between gap-3 p-3">
                                    <div className="truncate font-semibold">{selectedThread.other_user?.name ?? 'User'}</div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => setInfoOpen(true)}>
                                            <Info className="mr-1 h-4 w-4" />
                                            Info
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => (isArtist ? artistUpdate.mutate('disputed') : customerUpdate.mutate('dispute'))}
                                        >
                                            <Flag className="mr-1 h-4 w-4" />
                                            Report
                                        </Button>
                                    </div>
                                </div>
                                {order && (
                                    <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-sm">
                                        <span className="font-medium">Commission Request</span>
                                        <span className="text-muted-foreground">{stageStatus(order)}</span>
                                        <div className="relative">
                                            <Button type="button" size="sm" variant="ghost" onClick={() => setActionMenuOpen((open) => !open)}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                            {actionMenuOpen && (
                                                <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border bg-popover p-1 shadow-lg">
                                                    {isArtist && ['requested', 'quoted'].includes(order.status) && (
                                                        <button
                                                            type="button"
                                                            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                                            onClick={() => {
                                                                setQuoteOpen(true)
                                                                setActionMenuOpen(false)
                                                            }}
                                                        >
                                                            Quote
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                                        onClick={() => {
                                                            setStageOpen(true)
                                                            setActionMenuOpen(false)
                                                        }}
                                                    >
                                                        Stage
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="w-full rounded-md px-3 py-2 text-left text-sm text-red-500 hover:bg-muted"
                                                        onClick={() => {
                                                            ;(isArtist ? artistUpdate.mutate('cancelled') : customerUpdate.mutate('cancel'))
                                                            setActionMenuOpen(false)
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </header>

                            <div
                                className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
                                style={royaltyMessageBackgroundStyle(selectedBackground)}
                            >
                                {order && (
                                    <CommissionRequestBlock
                                        order={order}
                                        isArtist={isArtist}
                                        busy={quoteOrder.isPending || acceptQuote.isPending || artistUpdate.isPending}
                                        onViewDetails={() => setInfoOpen(true)}
                                        onQuote={() => setQuoteOpen(true)}
                                        onAccept={() => acceptQuote.mutate()}
                                        onReject={() => (isArtist ? artistUpdate.mutate('cancelled') : customerUpdate.mutate('cancel'))}
                                    />
                                )}
                                {messageData?.pagination?.has_more && (
                                    <div className="flex justify-center">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={loadOlderMessages.isPending}
                                            onClick={() => loadOlderMessages.mutate()}
                                        >
                                            {loadOlderMessages.isPending ? 'Loading...' : 'Load older messages'}
                                        </Button>
                                    </div>
                                )}
                                {timeline.map((item) => {
                                    if (item.type === 'revision') {
                                        return (
                                            <AdjustmentMessage
                                                key={`revision-${item.revision.id}`}
                                                revision={item.revision}
                                            />
                                        )
                                    }
                                    const message = item.message
                                    if (message.kind === 'stage_submission') {
                                        return (
                                            <StageSubmissionBlock
                                                key={message.id}
                                                message={message}
                                                mine={message.sender?.id === user?.id}
                                                needsAdjustment={submissionNeedsAdjustment(message, order)}
                                                isArtist={isArtist}
                                                busy={approveSubmission.isPending}
                                                onApprove={() => approveSubmission.mutate(message.id)}
                                                onAdjustment={() => {
                                                    setRevisionStepIndex(message.stage_index ?? defaultCreativeStepIndex(order!))
                                                    setRevisionOpen(true)
                                                }}
                                                onPreview={(src, title) => setImagePreview({ src, title })}
                                            />
                                        )
                                    }
                                    if (message.kind === 'final_delivery') {
                                        return (
                                            <FinalDeliveryBlock
                                                key={message.id}
                                                message={message}
                                                order={order!}
                                                mine={message.sender?.id === user?.id}
                                                isArtist={isArtist}
                                                busy={payFinalDelivery.isPending || archiveOrder.isPending}
                                                onPayFinal={() => payFinalDelivery.mutate()}
                                                onArchive={() => archiveOrder.mutate()}
                                                onPreview={(src, title) => setImagePreview({ src, title })}
                                            />
                                        )
                                    }

                                    const mine = message.sender?.id === user?.id
                                    return (
                                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex max-w-[76%] flex-col gap-2 ${mine ? 'items-end' : 'items-start'}`}>
                                                <RoyaltyMessageBubble mine={mine} design={selectedDesign}>
                                                    <div className="mb-1 text-[11px] opacity-75">{message.sender?.name ?? 'User'}</div>
                                                    {message.body && <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</p>}
                                                    {mine && preferences.message_read_receipts_enabled && (
                                                        <div className="mt-1 text-right text-[10px] opacity-70">
                                                            {message.read_by_recipient ? 'Read' : 'Sent'}
                                                        </div>
                                                    )}
                                                </RoyaltyMessageBubble>
                                                {message.image_path && (
                                                    <button type="button" className="block max-w-full overflow-hidden rounded-lg bg-muted" onClick={() => setImagePreview({ src: storageUrl(message.image_path)!, title: 'Message image' })}>
                                                        <img src={storageUrl(message.image_path)!} alt="" className="max-h-64 max-w-full object-contain" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="border-t p-3">
                                {image && (
                                    <div className="mb-2 flex items-center justify-between rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                                        <span className="truncate">{image.name}{isArtist ? ` · ${uploadType}` : ''}</span>
                                        <button type="button" onClick={() => setImage(null)} className="font-medium text-foreground">Remove</button>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border">
                                        <ImagePlus className="h-4 w-4" />
                                        <input type="file" accept="image/*" className="sr-only" onChange={attachImage} />
                                    </label>
                                    <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message..." className="min-h-10 resize-none" />
                                    <Button
                                        type="button"
                                        className="h-10"
                                        disabled={sendMessage.isPending || (!body.trim() && !image)}
                                        onClick={() => sendMessage.mutate()}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                            Select a commission conversation.
                        </div>
                    )}
                </section>
            </div>

            <MessageSettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                preferences={preferences}
                designs={preferenceData?.message_designs ?? []}
                backgrounds={preferenceData?.message_backgrounds ?? []}
                busy={savePreferences.isPending}
                onSave={(payload) => savePreferences.mutate(payload)}
            />

            <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                <DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden sm:max-w-2xl">
                    <DialogHeader><DialogTitle>Commission info</DialogTitle></DialogHeader>
                    {order && (
                        <div className="min-h-0 space-y-3 overflow-y-auto pr-2 text-sm">
                            <InfoRow label="Status" value={order.status.replace('_', ' ')} />
                            <InfoRow label="Quote" value={`${order.quote_credits} credits`} />
                            <InfoRow label="Escrow" value={`${order.escrow_credits} credits`} />
                            <InfoRow label="Released" value={`${order.released_credits} credits`} />
                            {order.auto_release_at && <InfoRow label="Auto-release" value={new Date(order.auto_release_at).toLocaleString()} />}
                            <div>
                                <div className="font-medium">Request</div>
                                <p className="mt-1 whitespace-pre-line text-muted-foreground">{order.request_message}</p>
                            </div>
                            {order.reference_notes && (
                                <div>
                                    <div className="font-medium">References</div>
                                    <p className="mt-1 whitespace-pre-line text-muted-foreground">{order.reference_notes}</p>
                                </div>
                            )}
                            {(order.request_answers?.length ?? 0) > 0 && (
                                <div>
                                    <div className="font-medium">Request form answers</div>
                                    <div className="mt-2 space-y-2">
                                        {order.request_answers!.map((answer, index) => (
                                            <div key={`${answer.question_id ?? index}`} className="rounded-lg border p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{answer.question}</p>
                                                <p className="mt-1 whitespace-pre-line">{answer.answer || '-'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {order.client_details && Object.values(order.client_details).some(Boolean) && (
                                <div>
                                    <div className="font-medium">Wanderer details</div>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                        {Object.entries(order.client_details).filter(([, value]) => Boolean(value)).map(([field, value]) => (
                                            <InfoRow key={field} label={clientDetailLabel(field)} value={value} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Send quote</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="grid gap-1.5">
                            <Label>Quote credits</Label>
                            <Input type="number" min={0} value={quoteCredits} onChange={(event) => setQuoteCredits(Number(event.target.value) || 0)} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Quote note</Label>
                            <Textarea value={quoteNote} onChange={(event) => setQuoteNote(event.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuoteOpen(false)}>Cancel</Button>
                        <Button disabled={quoteOrder.isPending} onClick={() => quoteOrder.mutate()}>Send quote</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={stageOpen} onOpenChange={setStageOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Update stage</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="grid gap-1.5">
                            <Label>Stage</Label>
                            <select value={stageIndex} onChange={(event) => setStageIndex(Number(event.target.value))} className="h-10 rounded-md border bg-background px-3 text-sm">
                                {(order?.flow_snapshot ?? []).map((step, index) => (
                                    <option key={`${step.label}-${index}`} value={index}>{step.label}{step.rounds ? ` (${step.rounds} attempts)` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <Textarea value={stageNote} onChange={(event) => setStageNote(event.target.value)} placeholder="Stage note for this update." />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStageOpen(false)}>Cancel</Button>
                        <Button disabled={advanceStage.isPending || !order?.flow_snapshot?.length} onClick={() => advanceStage.mutate()}>Save stage</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Need adjustments</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Textarea value={revisionReason} onChange={(event) => setRevisionReason(event.target.value)} className="min-h-32" placeholder="Explain what needs adjustment." />
                        <div className="grid gap-1.5">
                            <Label>Return to stage</Label>
                            <select value={revisionStepIndex} onChange={(event) => setRevisionStepIndex(Number(event.target.value))} className="h-10 rounded-md border bg-background px-3 text-sm">
                                {creativeSteps(order).map(({ step, index }) => (
                                    <option key={`${step.label}-${index}`} value={index}>{step.label} · {attemptText(order!, index, step)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevisionOpen(false)}>Cancel</Button>
                        <Button disabled={requestRevision.isPending || revisionReason.trim().length < 5} onClick={() => requestRevision.mutate(false)}>Send adjustment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={extraAttemptOpen} onOpenChange={setExtraAttemptOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>No attempts left</DialogTitle></DialogHeader>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>You have used all included attempts for this stage.</p>
                        <p>
                            Pay {order?.extra_attempt_credits ?? 1} credits for an extra attempt, or continue the original flow.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExtraAttemptOpen(false)}>Cancel</Button>
                        <Button disabled={requestRevision.isPending || revisionReason.trim().length < 5} onClick={() => requestRevision.mutate(true)}>
                            Pay extra attempt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={uploadTypeOpen} onOpenChange={setUploadTypeOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Image upload type</DialogTitle></DialogHeader>
                    <div className="grid gap-2">
                        {artistUploadTypes(order).map((type) => (
                            <button
                                key={type}
                                type="button"
                                className={`rounded-lg border px-4 py-3 text-left text-sm capitalize transition hover:bg-muted ${uploadType === type ? 'border-primary bg-primary/10' : ''}`}
                                onClick={() => {
                                    setUploadType(type)
                                    setUploadTypeOpen(false)
                                }}
                            >
                                {type === 'image' ? 'Image' : type}
                                <span className="mt-1 block text-xs normal-case text-muted-foreground">{uploadTypeDescription(type)}</span>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(imagePreview)} onOpenChange={(open) => !open && setImagePreview(null)}>
                <DialogContent className="h-[92dvh] !w-[min(96vw,1320px)] !max-w-none overflow-hidden p-0">
                    <DialogHeader className="border-b px-4 py-3"><DialogTitle>{imagePreview?.title ?? 'Image'}</DialogTitle></DialogHeader>
                    <div className="flex min-h-0 flex-1 items-center justify-center bg-muted p-4">
                        {imagePreview && <img src={imagePreview.src} alt="" className="max-h-[78dvh] max-w-full object-contain" draggable={false} />}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function CommissionRequestBlock({ order, isArtist, busy, onViewDetails, onQuote, onAccept, onReject }: {
    order: OrderInfo
    isArtist: boolean
    busy: boolean
    onViewDetails: () => void
    onQuote: () => void
    onAccept: () => void
    onReject: () => void
}) {
    if (!['requested', 'quoted'].includes(order.status)) {
        return (
            <CenteredBlock>
                <div className="font-semibold">Commission request</div>
                <div className="mt-1 text-sm text-muted-foreground">settled to {order.quote_credits} credits</div>
                <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={onViewDetails}>View Details</Button>
                </div>
            </CenteredBlock>
        )
    }

    return (
        <CenteredBlock>
            <div className="font-semibold">Commission request</div>
            <div className="mt-1 text-sm text-muted-foreground">
                {order.status === 'quoted' ? `Quote: ${order.quote_credits} credits` : 'Awaiting artist quote'}
            </div>
            <div className="mt-3 grid gap-2">
                <Button size="sm" variant="outline" onClick={onViewDetails}>View Details</Button>
                {isArtist && <Button size="sm" disabled={busy} onClick={onQuote}>Quote</Button>}
                {!isArtist && order.status === 'quoted' && (
                    <Button size="sm" disabled={busy} onClick={onAccept}>Accept Quote</Button>
                )}
                <Button size="sm" variant="destructive" disabled={busy} onClick={onReject}>
                    {isArtist ? 'Cancel' : 'Reject'}
                </Button>
            </div>
        </CenteredBlock>
    )
}

function AdjustmentMessage({
    revision,
}: {
    revision: CommissionRevision
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-center">
                <div className="rounded-full bg-muted px-4 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    --- Adjustment ---
                </div>
            </div>
            <div className="flex justify-center">
                <div className="w-fit max-w-[76%] rounded-xl bg-muted px-4 py-2 text-center text-sm">
                    <p className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{revision.reason}</p>
                    {revision.extra_attempt_credits > 0 && (
                        <div className="mt-1 text-[10px] opacity-70">
                            Extra attempt paid: {revision.extra_attempt_credits} credits
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StageSubmissionBlock({ message, mine, needsAdjustment, isArtist, busy, onApprove, onAdjustment, onPreview }: {
    message: Message
    mine: boolean
    needsAdjustment: boolean
    isArtist: boolean
    busy: boolean
    onApprove: () => void
    onAdjustment: () => void
    onPreview: (src: string, title: string) => void
}) {
    const imageSrc = message.image_path ? storageUrl(message.image_path) : null
    const statusText = needsAdjustment ? 'Need adjustment' : (message.approval_status ?? 'submitted')

    return (
        <AlignedBlock mine={mine}>
            <div className="font-semibold">Image Submitted</div>
            <div className="mt-1 text-sm capitalize text-muted-foreground">{message.upload_type}</div>
            {imageSrc && (
                <button type="button" className="mx-auto mt-3 block h-32 w-32 overflow-hidden rounded-lg bg-muted" onClick={() => onPreview(imageSrc, `${message.upload_type} image`)}>
                    <img src={imageSrc} alt="" className="h-full w-full object-cover" />
                </button>
            )}
            {message.approval_status === 'pending' && !needsAdjustment && !isArtist ? (
                <div className="mt-3 grid gap-2">
                    <Button size="sm" disabled={busy} onClick={onApprove}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={onAdjustment}>Adjustment</Button>
                </div>
            ) : (
                <div className="mt-3 text-xs capitalize text-muted-foreground">{statusText}</div>
            )}
        </AlignedBlock>
    )
}

function FinalDeliveryBlock({ message, order, mine, isArtist, busy, onPayFinal, onArchive, onPreview }: {
    message: Message
    order: OrderInfo
    mine: boolean
    isArtist: boolean
    busy: boolean
    onPayFinal: () => void
    onArchive: () => void
    onPreview: (src: string, title: string) => void
}) {
    const file = message.delivery_file
    const finalUnlocked = order.status === 'completed' || Boolean(order.final_payment_paid_at)
    const previewSrc = file ? storageUrl(finalUnlocked ? file.file_path : (file.preview_path ?? file.file_path)) : (message.image_path ? storageUrl(message.image_path) : null)
    const originalSrc = file ? storageUrl(file.file_path) : null

    return (
        <AlignedBlock mine={mine}>
            <div className="font-semibold">Final Art Image</div>
            <div className="mt-1 text-sm text-muted-foreground">{finalUnlocked ? 'Original Image' : 'Watermarked Image'}</div>
            {previewSrc && (
                <button type="button" className="mx-auto mt-3 block h-36 w-36 overflow-hidden rounded-lg bg-muted" onClick={() => onPreview(previewSrc, finalUnlocked ? 'Final art original' : 'Final art preview')}>
                    <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                </button>
            )}
            <div className="mt-3 grid gap-2">
                {previewSrc && <Button size="sm" variant="outline" onClick={() => onPreview(previewSrc, finalUnlocked ? 'Final art original' : 'Final art preview')}>View</Button>}
                {!isArtist && !finalUnlocked && <Button size="sm" disabled={busy} onClick={onPayFinal}>Final Pay</Button>}
                {!isArtist && finalUnlocked && originalSrc && (
                    <Button asChild size="sm">
                        <a href={originalSrc} download><Download className="mr-1 h-4 w-4" />Download</a>
                    </Button>
                )}
                {isArtist && order.status === 'completed' && (
                    <Button size="sm" variant="outline" disabled={busy || Boolean(order.archived_at)} onClick={onArchive}>
                        {order.archived_at ? 'Archived' : 'Archive'}
                    </Button>
                )}
            </div>
        </AlignedBlock>
    )
}

function AlignedBlock({ children, mine }: { children: ReactNode; mine: boolean }) {
    return (
        <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className="w-full max-w-xs rounded-xl border bg-background p-4 text-center shadow-sm">{children}</div>
        </div>
    )
}

function CenteredBlock({ children }: { children: ReactNode }) {
    return (
        <div className="flex justify-center">
            <div className="w-full max-w-xs rounded-xl border bg-background p-4 text-center shadow-sm">{children}</div>
        </div>
    )
}

function MessageSettingsDialog({
    open,
    onOpenChange,
    preferences,
    designs,
    backgrounds,
    busy,
    onSave,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    preferences: MessagePreferences
    designs: RoyaltyDesignAsset[]
    backgrounds: RoyaltyDesignAsset[]
    busy: boolean
    onSave: (payload: MessagePreferences) => void
}) {
    const [draft, setDraft] = useState<MessagePreferences>(preferences)

    useEffect(() => setDraft(preferences), [preferences])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader><DialogTitle>Message settings</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={draft.message_read_receipts_enabled} onChange={(event) => setDraft((current) => ({ ...current, message_read_receipts_enabled: event.target.checked }))} />
                        Read receipts
                    </label>
                    <AssetPicker label="Message Design" value={draft.message_design_id} assets={designs} onChange={(message_design_id) => setDraft((current) => ({ ...current, message_design_id }))} />
                    <AssetPicker label="Message Background" value={draft.message_background_id} assets={backgrounds} onChange={(message_background_id) => setDraft((current) => ({ ...current, message_background_id }))} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button disabled={busy} onClick={() => onSave(draft)}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AssetPicker({ label, value, assets, onChange }: {
    label: string
    value: string | null
    assets: RoyaltyDesignAsset[]
    onChange: (id: string | null) => void
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                <button type="button" onClick={() => onChange(null)} className={`flex h-20 items-center justify-center rounded-lg border text-xs ${!value ? 'border-primary bg-primary/10' : ''}`}>Default</button>
                {assets.map((asset) => (
                    <button key={asset.id} type="button" onClick={() => onChange(asset.id)} className={`overflow-hidden rounded-lg border ${value === asset.id ? 'border-primary ring-2 ring-primary/30' : ''}`} title={asset.name}>
                        <img src={storageUrl(asset.image_path)!} alt={asset.name} className="h-20 w-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    )
}

function creativeSteps(order: OrderInfo | null) {
    return (order?.flow_snapshot ?? [])
        .map((step, index) => ({ step, index }))
        .filter(({ step }) => ['sketch', 'revision', 'draft', 'add'].includes(step.type))
}

function buildTimeline(messages: Message[], revisions: CommissionRevision[]) {
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

    return [...messageItems, ...revisionItems].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
}

function visibleRevisionItems(revisions: CommissionRevision[], messages: Message[], hasMore: boolean) {
    if (!hasMore || messages.length === 0) return revisions

    const oldestLoadedAt = new Date(messages[0].created_at).getTime()
    return revisions.filter((revision) => new Date(revision.created_at).getTime() >= oldestLoadedAt)
}

function mergeMessages(olderMessages: Message[], currentMessages: Message[]) {
    const seen = new Set<string>()
    return [...olderMessages, ...currentMessages].filter((message) => {
        if (seen.has(message.id)) return false
        seen.add(message.id)
        return true
    })
}

function submissionNeedsAdjustment(message: Message, order: OrderInfo | null) {
    if (!order || message.kind !== 'stage_submission' || message.approval_status !== 'pending') return false

    return order.revisions.some((revision) => {
        if (!['requested', 'pending'].includes(revision.status ?? '')) return false
        if (revision.requested_step_index !== null && message.stage_index !== null) {
            return Number(revision.requested_step_index) === Number(message.stage_index)
        }

        return new Date(revision.created_at).getTime() >= new Date(message.created_at).getTime()
    })
}

function defaultCreativeStepIndex(order: OrderInfo) {
    const current = order.current_step_index ?? 0
    if (['sketch', 'revision', 'draft', 'add'].includes(order.flow_snapshot[current]?.type)) return current
    return creativeSteps(order)[0]?.index ?? 0
}

function attemptText(order: OrderInfo, index: number, step: CommissionStep) {
    const used = order.stage_attempts_used?.[String(index)] ?? 0
    const limit = step.rounds ?? 0
    return limit > 0 ? `${used}/${limit} attempts used` : `${used} attempts used`
}

function artistUploadTypes(order: OrderInfo | null): UploadType[] {
    const types: UploadType[] = ['image']
    if ((order?.flow_snapshot ?? []).some((step) => step.type === 'sketch')) types.push('sketch')
    if ((order?.flow_snapshot ?? []).some((step) => step.type === 'revision')) types.push('revision')
    types.push('final')
    return types
}

function uploadTypeDescription(type: UploadType) {
    if (type === 'sketch') return 'Submits a sketch and waits for approval or adjustment.'
    if (type === 'revision') return 'Submits a revision and waits for approval or adjustment.'
    if (type === 'final') return 'Submits the final art with a watermarked preview and final payment.'
    return 'Sends a normal chat image without changing the commission flow.'
}

function stageStatus(order: OrderInfo) {
    const step = order.flow_snapshot?.[order.current_step_index]
    return step?.label ? `${step.label} · ${order.status.replace('_', ' ')}` : order.status.replace('_', ' ')
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b pb-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium capitalize">{value}</span>
        </div>
    )
}

function clientDetailLabel(field: string) {
    return ({
        name: 'Name',
        email: 'Email',
        discord: 'Discord',
        twitter: 'Twitter / X',
        instagram: 'Instagram',
    } as Record<string, string>)[field] ?? field
}
