import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Flag, ImagePlus, Info, MoreHorizontal, Send, Settings } from 'lucide-react'
import { commissionApi } from '@/api/commissions'
import { studioApi } from '@/api/studio'
import { useAuthStore } from '@/store/authStore'
import { storageUrl } from '@/utils/storage'
import {
    RoyaltyMessageBubble,
    royaltyMessageBackgroundStyle,
} from '@/components/royalty/RoyaltyDesignRenderer'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type {
    CommissionQuote,
    InboxFilter,
    MessagePreferenceResponse,
    MessagePreferences,
    MessageResponse,
    Thread,
    UploadType,
} from '@/features/commissions/types/messages'
import {
    artistUploadTypes,
    attemptText,
    buildTimeline,
    canArchiveCommission,
    canArtistManageStage,
    canCancelCommission,
    creativeSteps,
    defaultCreativeStepIndex,
    mergeMessages,
    shouldShowCommissionRequest,
    stageStatus,
    submissionNeedsAdjustment,
    uploadTypeDescription,
    visibleRevisionItems,
} from '@/features/commissions/utils/messageWorkflow'
import {
    INBOX_FILTER_LABELS,
    INBOX_FILTERS,
    inboxFilterCounts,
    threadMatchesInboxFilter,
    threadTitle,
    threadTypeLabel,
} from '@/features/commissions/utils/inbox'
import {
    AdjustmentMessage,
    CommissionQuoteBlock,
    CommissionRequestBlock,
    FinalDeliveryBlock,
    InfoRow,
    MessageSettingsDialog,
    ServiceHistoryPanel,
    StageSubmissionBlock,
    SystemMessageBlock,
    clientDetailLabel,
} from '@/features/commissions/components/MessageThreadBlocks'

export default function Messages() {
    const [searchParams, setSearchParams] = useSearchParams()
    const requestedOrder = searchParams.get('order')
    const requestedArtist = searchParams.get('to')
    const [selectedId, setSelectedId] = useState<string | null>(requestedOrder)
    const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all')
    const [body, setBody] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [uploadType, setUploadType] = useState<UploadType>('image')
    const [infoOpen, setInfoOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [quoteOpen, setQuoteOpen] = useState(false)
    const [quoteDetails, setQuoteDetails] = useState<CommissionQuote | null>(null)
    const [renegotiationQuote, setRenegotiationQuote] = useState<CommissionQuote | null>(null)
    const [rejectQuoteTarget, setRejectQuoteTarget] = useState<CommissionQuote | null>(null)
    const [renegotiationReason, setRenegotiationReason] = useState('')
    const [preferredCredits, setPreferredCredits] = useState('')
    const [requestedChanges, setRequestedChanges] = useState('')
    const [quoteRejectionReason, setQuoteRejectionReason] = useState('')
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

    const { data: threadData, isLoading } = useQuery<{
        threads: { data: Thread[] }
        preferences: MessagePreferences
    }>({
        queryKey: ['commission-message-threads'],
        queryFn: () => commissionApi.getMessageThreads().then((res) => res.data),
    })

    const { data: preferenceData } = useQuery<MessagePreferenceResponse>({
        queryKey: ['message-preferences'],
        queryFn: () => commissionApi.getMessagePreferences().then((res) => res.data),
    })

    const threads = threadData?.threads.data ?? []
    const filteredThreads = useMemo(
        () => threads.filter((thread) => threadMatchesInboxFilter(thread, inboxFilter)),
        [inboxFilter, threads]
    )
    const inboxCounts = useMemo(() => inboxFilterCounts(threads), [threads])
    const preferences = preferenceData?.preferences ??
        threadData?.preferences ?? {
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
    const quotes = order?.quotes ?? []
    const latestQuote = quotes.length > 0 ? quotes[quotes.length - 1] : null
    const hasQuoteHistory = quotes.length > 0
    const isArtist = Boolean(order?.artist?.id && order.artist.id === user?.id)
    const isCommissionOrder = Boolean(order?.service)
    const showCommissionRequest = Boolean(
        order && isCommissionOrder && shouldShowCommissionRequest(order)
    )
    const canArtistUseStage = Boolean(order && isArtist && canArtistManageStage(order))
    const canCancel = Boolean(order && canCancelCommission(order))
    const canArchive = Boolean(order && isArtist && canArchiveCommission(order))
    const relatedServiceThreads = useMemo(
        () =>
            threads.filter(
                (thread) =>
                    thread.type === 'commission' &&
                    Boolean(thread.service) &&
                    Boolean(thread.other_user?.id) &&
                    thread.other_user?.id === selectedThread?.other_user?.id &&
                    thread.status !== 'cancelled' &&
                    !thread.archived_at
            ),
        [selectedThread?.other_user?.id, threads]
    )
    const selectedBackground =
        preferenceData?.message_backgrounds.find(
            (asset) => asset.id === preferences.message_background_id
        ) ?? null
    const selectedDesign =
        preferenceData?.message_designs.find(
            (asset) => asset.id === preferences.message_design_id
        ) ?? null
    const visibleRevisions = useMemo(
        () =>
            visibleRevisionItems(
                order?.revisions ?? [],
                messages,
                Boolean(messageData?.pagination?.has_more)
            ),
        [order?.revisions, messages, messageData?.pagination?.has_more]
    )
    const timeline = useMemo(
        () => buildTimeline(messages, visibleRevisions, quotes),
        [messages, visibleRevisions, quotes]
    )

    useEffect(() => {
        if (!messageData?.order?.id) return

        queryClient.invalidateQueries({ queryKey: ['notification-center'] })
        queryClient.invalidateQueries({ queryKey: ['account-notifications'] })
    }, [messageData?.order?.id, queryClient])

    useEffect(() => {
        if (!order) return
        setQuoteCredits(latestQuote?.quote_credits ?? order.quote_credits ?? 0)
        setQuoteNote(latestQuote?.quote_note ?? order.quote_note ?? '')
        setStageIndex(order.current_step_index || 0)
        setRevisionStepIndex(defaultCreativeStepIndex(order))
    }, [
        order?.id,
        order?.quote_credits,
        order?.quote_note,
        order?.current_step_index,
        latestQuote?.id,
        latestQuote?.quote_credits,
        latestQuote?.quote_note,
    ])

    const refreshMessages = () => {
        queryClient.invalidateQueries({ queryKey: ['commission-messages', selectedId] })
        queryClient.invalidateQueries({ queryKey: ['commission-message-threads'] })
        queryClient.invalidateQueries({ queryKey: ['notification-center'] })
        queryClient.invalidateQueries({ queryKey: ['account-notifications'] })
    }

    const openQuoteComposer = () => {
        setQuoteCredits(latestQuote?.quote_credits ?? order?.quote_credits ?? 0)
        setQuoteNote(latestQuote?.quote_note ?? order?.quote_note ?? '')
        setQuoteOpen(true)
    }

    const openRenegotiation = (quote: CommissionQuote) => {
        setRenegotiationReason('')
        setPreferredCredits('')
        setRequestedChanges('')
        setRenegotiationQuote(quote)
    }

    const openQuoteRejection = (quote: CommissionQuote) => {
        setQuoteRejectionReason('')
        setRejectQuoteTarget(quote)
    }

    const loadOlderMessages = useMutation({
        mutationFn: () =>
            commissionApi
                .getMessages(selectedId!, { before: messageData?.pagination?.next_before })
                .then((res) => res.data as MessageResponse),
        onSuccess: (olderData) => {
            queryClient.setQueryData<MessageResponse>(
                ['commission-messages', selectedId],
                (current) => {
                    if (!current) return olderData
                    return {
                        ...current,
                        order: olderData.order,
                        messages: mergeMessages(olderData.messages, current.messages),
                        pagination: olderData.pagination,
                    }
                }
            )
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not load older messages.'),
    })

    const sendMessage = useMutation({
        mutationFn: () => {
            const payload = new FormData()
            payload.append('body', body.trim())
            if (image) payload.append('image', image)
            if (image && isArtist && isCommissionOrder) payload.append('upload_type', uploadType)
            return commissionApi.sendMessage(selectedId!, payload).then((res) => res.data)
        },
        onSuccess: () => {
            setBody('')
            setImage(null)
            setUploadType('image')
            refreshMessages()
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not send message.'),
    })

    const startDirectThread = useMutation({
        mutationFn: (username: string) =>
            commissionApi.startDirectThread(username).then((res) => res.data),
        onSuccess: (data) => {
            const threadId = data?.thread?.id
            if (threadId) {
                setSelectedId(threadId)
                setSearchParams({ order: threadId })
            }
            queryClient.invalidateQueries({ queryKey: ['commission-message-threads'] })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not open messages.'),
    })

    useEffect(() => {
        if (!requestedArtist || startDirectThread.isPending) return
        startDirectThread.mutate(requestedArtist)
    }, [requestedArtist])

    const savePreferences = useMutation({
        mutationFn: (payload: MessagePreferences) =>
            commissionApi.updateMessagePreferences(payload).then((res) => res.data),
        onSuccess: () => {
            toast.success('Message settings saved.')
            queryClient.invalidateQueries({ queryKey: ['message-preferences'] })
            setSettingsOpen(false)
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not save message settings.'),
    })

    const quoteOrder = useMutation({
        mutationFn: () =>
            studioApi
                .quoteCommissionOrder(order!.id, {
                    quote_credits: quoteCredits,
                    quote_note: quoteNote.trim() || undefined,
                    flow: order?.flow_snapshot ?? [],
                })
                .then((res) => res.data),
        onSuccess: () => {
            toast.success(hasQuoteHistory ? 'Changed quote sent.' : 'Quote sent.')
            setQuoteOpen(false)
            refreshMessages()
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not send quote.'),
    })

    const artistUpdate = useMutation({
        mutationFn: (status: 'in_progress' | 'delivered' | 'cancelled' | 'disputed') =>
            studioApi.updateCommissionOrder(order!.id, { status }).then((res) => res.data),
        onSuccess: () => refreshMessages(),
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not update commission.'),
    })

    const customerUpdate = useMutation({
        mutationFn: (action: 'cancel' | 'dispute') =>
            commissionApi.updateAccountOrder(order!.id, action).then((res) => res.data),
        onSuccess: () => refreshMessages(),
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not update commission.'),
    })

    const acceptQuote = useMutation({
        mutationFn: (quoteId: string) =>
            commissionApi.acceptQuote(order!.id, quoteId).then((res) => res.data),
        onSuccess: () => {
            toast.success('Quote accepted.')
            refreshMessages()
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not accept quote.'),
    })

    const requestNewQuote = useMutation({
        mutationFn: () =>
            commissionApi
                .requestNewQuote(order!.id, {
                    quote_id: renegotiationQuote!.id,
                    reason: renegotiationReason.trim(),
                    preferred_credits:
                        preferredCredits.trim() === '' ? undefined : Number(preferredCredits),
                    requested_changes: requestedChanges.trim() || undefined,
                })
                .then((res) => res.data),
        onSuccess: () => {
            toast.success('New quote requested.')
            setRenegotiationQuote(null)
            setRenegotiationReason('')
            setPreferredCredits('')
            setRequestedChanges('')
            refreshMessages()
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not request a new quote.'),
    })

    const rejectQuote = useMutation({
        mutationFn: () =>
            commissionApi
                .rejectQuote(order!.id, {
                    quote_id: rejectQuoteTarget!.id,
                    reason: quoteRejectionReason.trim() || undefined,
                })
                .then((res) => res.data),
        onSuccess: () => {
            toast.success('Quote rejected. The commission request remains open.')
            setRejectQuoteTarget(null)
            setQuoteRejectionReason('')
            refreshMessages()
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not reject the quote.'),
    })

    const payFinalDelivery = useMutation({
        mutationFn: () => commissionApi.payFinalDelivery(order!.id).then((res) => res.data),
        onSuccess: (data) => {
            toast.success(data?.message ?? 'Final delivery paid.')
            refreshMessages()
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not pay final delivery.'),
    })

    const requestRevision = useMutation({
        mutationFn: (payExtra: boolean = false) =>
            commissionApi
                .requestRevision(order!.id, {
                    reason: revisionReason,
                    step_index: revisionStepIndex,
                    pay_extra: payExtra,
                })
                .then((res) => res.data),
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
            studioApi
                .advanceCommissionStage(order!.id, {
                    step_index: stageIndex,
                    note: stageNote.trim() || undefined,
                })
                .then((res) => res.data),
        onSuccess: () => {
            toast.success('Stage updated.')
            setStageOpen(false)
            setStageNote('')
            refreshMessages()
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not update stage.'),
    })

    const archiveOrder = useMutation({
        mutationFn: () => studioApi.archiveCommissionOrder(order!.id).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission archived.')
            refreshMessages()
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not archive commission.'),
    })

    const approveSubmission = useMutation({
        mutationFn: (messageId: string) =>
            commissionApi.approveSubmission(messageId).then((res) => res.data),
        onSuccess: () => {
            toast.success('Submission approved.')
            refreshMessages()
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not approve submission.'),
    })

    const selectThread = (id: string) => {
        setSelectedId(id)
        setSearchParams({ order: id })
        commissionApi.markMessagesRead(id).finally(() => {
            queryClient.invalidateQueries({ queryKey: ['commission-message-threads'] })
            queryClient.invalidateQueries({ queryKey: ['notification-center'] })
            queryClient.invalidateQueries({ queryKey: ['account-notifications'] })
        })
    }

    const attachImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        setImage(file)
        if (file && isArtist && isCommissionOrder) setUploadTypeOpen(true)
    }

    return (
        <div className="rounded-3xl border bg-muted/30 p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Commission conversations with text, images, request information, and
                        delivery stages.
                    </p>
                </div>
                <Button type="button" variant="outline" onClick={() => setSettingsOpen(true)}>
                    <Settings className="mr-1 h-4 w-4" />
                    Settings
                </Button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {INBOX_FILTERS.map((filter) => (
                    <Button
                        key={filter.value}
                        type="button"
                        size="sm"
                        variant={inboxFilter === filter.value ? 'default' : 'outline'}
                        onClick={() => setInboxFilter(filter.value)}
                    >
                        {filter.label}
                        <span className="ml-1 rounded-full bg-background/70 px-1.5 text-[10px] text-foreground">
                            {inboxCounts[filter.value]}
                        </span>
                    </Button>
                ))}
            </div>

            <div
                className={`grid h-[72dvh] min-h-[560px] overflow-hidden rounded-xl border bg-background ${
                    isCommissionOrder
                        ? 'lg:grid-cols-[320px_minmax(0,1fr)_300px]'
                        : 'lg:grid-cols-[320px_minmax(0,1fr)]'
                }`}
            >
                <aside className="min-h-0 overflow-y-auto border-b lg:border-r lg:border-b-0">
                    {isLoading ? (
                        <div className="p-4 text-sm text-muted-foreground">Loading messages...</div>
                    ) : filteredThreads.length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">
                            No {INBOX_FILTER_LABELS[inboxFilter].toLowerCase()} messages yet.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredThreads.map((thread) => (
                                <button
                                    key={thread.id}
                                    type="button"
                                    onClick={() => selectThread(thread.id)}
                                    className={`flex w-full gap-3 p-3 text-left transition ${selectedId === thread.id ? 'bg-muted' : 'hover:bg-muted/60'}`}
                                >
                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                        {thread.service?.image_path ? (
                                            <img
                                                src={storageUrl(thread.service.image_path)!}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : thread.other_user?.avatar ? (
                                            <img
                                                src={storageUrl(thread.other_user.avatar)!}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                                                {(thread.other_user?.name ?? 'U').slice(0, 1)}
                                            </div>
                                        )}
                                        {thread.unread_count > 0 && (
                                            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold">
                                            {threadTitle(thread)}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {thread.other_user?.name ?? 'User'} -{' '}
                                            {threadTypeLabel(thread)}
                                        </div>
                                        <div className="mt-1 truncate text-xs text-muted-foreground">
                                            {thread.last_message?.body ||
                                                (thread.last_message?.image_path
                                                    ? 'Image'
                                                    : 'No messages yet')}
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
                                    <div className="truncate font-semibold">
                                        {selectedThread.other_user?.name ?? 'User'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setInfoOpen(true)}
                                        >
                                            <Info className="mr-1 h-4 w-4" />
                                            Info
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                isArtist
                                                    ? artistUpdate.mutate('disputed')
                                                    : customerUpdate.mutate('dispute')
                                            }
                                        >
                                            <Flag className="mr-1 h-4 w-4" />
                                            Report
                                        </Button>
                                    </div>
                                </div>
                                {order && isCommissionOrder && (
                                    <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-sm">
                                        <span className="font-medium">
                                            {showCommissionRequest
                                                ? 'Commission Request'
                                                : 'Commission'}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {stageStatus(order)}
                                        </span>
                                        <div className="relative">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setActionMenuOpen((open) => !open)}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                            {actionMenuOpen && (
                                                <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border bg-popover p-1 shadow-lg">
                                                    <button
                                                        type="button"
                                                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                                        onClick={() => {
                                                            setInfoOpen(true)
                                                            setActionMenuOpen(false)
                                                        }}
                                                    >
                                                        Details
                                                    </button>

                                                    {isArtist &&
                                                        ['requested', 'quoted'].includes(
                                                            order.status
                                                        ) && (
                                                            <button
                                                                type="button"
                                                                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                                                onClick={() => {
                                                                    openQuoteComposer()
                                                                    setActionMenuOpen(false)
                                                                }}
                                                            >
                                                                {hasQuoteHistory
                                                                    ? 'Change Quote'
                                                                    : 'Create Quote'}
                                                            </button>
                                                        )}

                                                    {canArtistUseStage && (
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
                                                    )}

                                                    {canCancel && (
                                                        <button
                                                            type="button"
                                                            className="w-full rounded-md px-3 py-2 text-left text-sm text-red-500 hover:bg-muted"
                                                            onClick={() => {
                                                                isArtist
                                                                    ? artistUpdate.mutate(
                                                                          'cancelled'
                                                                      )
                                                                    : customerUpdate.mutate(
                                                                          'cancel'
                                                                      )
                                                                setActionMenuOpen(false)
                                                            }}
                                                        >
                                                            {isArtist
                                                                ? 'Cancel Commission'
                                                                : 'Cancel Request'}
                                                        </button>
                                                    )}

                                                    {canArchive && (
                                                        <button
                                                            type="button"
                                                            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                                            disabled={archiveOrder.isPending}
                                                            onClick={() => {
                                                                archiveOrder.mutate()
                                                                setActionMenuOpen(false)
                                                            }}
                                                        >
                                                            {archiveOrder.isPending
                                                                ? 'Archiving...'
                                                                : 'Archive'}
                                                        </button>
                                                    )}

                                                    {isArtist &&
                                                        order.status === 'completed' &&
                                                        Boolean(order.archived_at) && (
                                                            <button
                                                                type="button"
                                                                disabled
                                                                className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground"
                                                            >
                                                                Archived
                                                            </button>
                                                        )}
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
                                {order && isCommissionOrder && showCommissionRequest && (
                                    <CommissionRequestBlock
                                        order={order}
                                        latestQuote={latestQuote}
                                        hasQuoteHistory={hasQuoteHistory}
                                        isArtist={isArtist}
                                        busy={
                                            quoteOrder.isPending ||
                                            acceptQuote.isPending ||
                                            requestNewQuote.isPending ||
                                            rejectQuote.isPending ||
                                            artistUpdate.isPending ||
                                            customerUpdate.isPending
                                        }
                                        onViewDetails={() => setInfoOpen(true)}
                                        onQuote={openQuoteComposer}
                                        onCancel={() =>
                                            isArtist
                                                ? artistUpdate.mutate('cancelled')
                                                : customerUpdate.mutate('cancel')
                                        }
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
                                            {loadOlderMessages.isPending
                                                ? 'Loading...'
                                                : 'Load older messages'}
                                        </Button>
                                    </div>
                                )}
                                {timeline.map((item) => {
                                    if (item.type === 'quote') {
                                        return (
                                            <CommissionQuoteBlock
                                                key={`quote-${item.quote.id}`}
                                                quote={item.quote}
                                                isLatest={item.quote.id === latestQuote?.id}
                                                isArtist={isArtist}
                                                busy={
                                                    quoteOrder.isPending ||
                                                    acceptQuote.isPending ||
                                                    requestNewQuote.isPending ||
                                                    rejectQuote.isPending
                                                }
                                                onViewDetails={() => setQuoteDetails(item.quote)}
                                                onChangeQuote={openQuoteComposer}
                                                onAccept={() => acceptQuote.mutate(item.quote.id)}
                                                onRequestNew={() => openRenegotiation(item.quote)}
                                                onReject={() => openQuoteRejection(item.quote)}
                                            />
                                        )
                                    }
                                    if (item.type === 'revision') {
                                        return (
                                            <AdjustmentMessage
                                                key={`revision-${item.revision.id}`}
                                                revision={item.revision}
                                            />
                                        )
                                    }
                                    const message = item.message
                                    if (message.kind === 'system') {
                                        return (
                                            <SystemMessageBlock
                                                key={message.id}
                                                message={message}
                                            />
                                        )
                                    }
                                    if (message.kind === 'stage_submission') {
                                        return (
                                            <StageSubmissionBlock
                                                key={message.id}
                                                message={message}
                                                mine={message.sender?.id === user?.id}
                                                needsAdjustment={submissionNeedsAdjustment(
                                                    message,
                                                    order
                                                )}
                                                isArtist={isArtist}
                                                busy={approveSubmission.isPending}
                                                onApprove={() =>
                                                    approveSubmission.mutate(message.id)
                                                }
                                                onAdjustment={() => {
                                                    setRevisionStepIndex(
                                                        message.stage_index ??
                                                            defaultCreativeStepIndex(order!)
                                                    )
                                                    setRevisionOpen(true)
                                                }}
                                                onPreview={(src, title) =>
                                                    setImagePreview({ src, title })
                                                }
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
                                                busy={
                                                    payFinalDelivery.isPending ||
                                                    archiveOrder.isPending
                                                }
                                                onPayFinal={() => payFinalDelivery.mutate()}
                                                onArchive={() => archiveOrder.mutate()}
                                                onPreview={(src, title) =>
                                                    setImagePreview({ src, title })
                                                }
                                            />
                                        )
                                    }

                                    const mine = message.sender?.id === user?.id
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`flex max-w-[76%] flex-col gap-2 ${mine ? 'items-end' : 'items-start'}`}
                                            >
                                                <RoyaltyMessageBubble
                                                    mine={mine}
                                                    design={selectedDesign}
                                                >
                                                    <div className="mb-1 text-[11px] opacity-75">
                                                        {message.sender?.name ?? 'User'}
                                                    </div>
                                                    {message.body && (
                                                        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                                            {message.body}
                                                        </p>
                                                    )}
                                                    {mine &&
                                                        preferences.message_read_receipts_enabled && (
                                                            <div className="mt-1 text-right text-[10px] opacity-70">
                                                                {message.read_by_recipient
                                                                    ? 'Read'
                                                                    : 'Sent'}
                                                            </div>
                                                        )}
                                                </RoyaltyMessageBubble>
                                                {message.image_path && (
                                                    <button
                                                        type="button"
                                                        className="block max-w-full overflow-hidden rounded-lg bg-muted"
                                                        onClick={() =>
                                                            setImagePreview({
                                                                src: storageUrl(
                                                                    message.image_path
                                                                )!,
                                                                title: 'Message image',
                                                            })
                                                        }
                                                    >
                                                        <img
                                                            src={storageUrl(message.image_path)!}
                                                            alt=""
                                                            className="max-h-64 max-w-full object-contain"
                                                        />
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
                                        <span className="truncate">
                                            {image.name}
                                            {isArtist ? ` · ${uploadType}` : ''}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setImage(null)}
                                            className="font-medium text-foreground"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border">
                                        <ImagePlus className="h-4 w-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={attachImage}
                                        />
                                    </label>
                                    <Textarea
                                        value={body}
                                        onChange={(event) => setBody(event.target.value)}
                                        placeholder="Write a message..."
                                        className="min-h-10 resize-none"
                                    />
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
                            Select a conversation.
                        </div>
                    )}
                </section>

                {selectedThread && isCommissionOrder && (
                    <ServiceHistoryPanel
                        order={order}
                        threads={relatedServiceThreads}
                        selectedId={selectedId}
                        onSelect={selectThread}
                        onViewDetails={() => setInfoOpen(true)}
                    />
                )}
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
                    <DialogHeader>
                        <DialogTitle>
                            {isCommissionOrder ? 'Commission info' : 'Conversation info'}
                        </DialogTitle>
                    </DialogHeader>
                    {order && (
                        <div className="min-h-0 space-y-3 overflow-y-auto pr-2 text-sm">
                            <InfoRow label="Status" value={order.status.replace('_', ' ')} />
                            <InfoRow label="Quote" value={`${order.quote_credits} credits`} />
                            <InfoRow label="Escrow" value={`${order.escrow_credits} credits`} />
                            <InfoRow label="Released" value={`${order.released_credits} credits`} />
                            {order.auto_release_at && (
                                <InfoRow
                                    label="Auto-release"
                                    value={new Date(order.auto_release_at).toLocaleString()}
                                />
                            )}
                            <div>
                                <div className="font-medium">Request</div>
                                <p className="mt-1 whitespace-pre-line text-muted-foreground">
                                    {order.request_message}
                                </p>
                            </div>
                            {order.reference_notes && (
                                <div>
                                    <div className="font-medium">References</div>
                                    <p className="mt-1 whitespace-pre-line text-muted-foreground">
                                        {order.reference_notes}
                                    </p>
                                </div>
                            )}
                            {(order.request_answers?.length ?? 0) > 0 && (
                                <div>
                                    <div className="font-medium">Request form answers</div>
                                    <div className="mt-2 space-y-2">
                                        {order.request_answers!.map((answer, index) => (
                                            <div
                                                key={`${answer.question_id ?? index}`}
                                                className="rounded-lg border p-3"
                                            >
                                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {answer.question}
                                                </p>
                                                <p className="mt-1 whitespace-pre-line">
                                                    {answer.answer || '-'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {order.client_details &&
                                Object.entries(order.client_details).some(
                                    ([field, value]) => field !== 'nickname' && Boolean(value)
                                ) && (
                                    <div>
                                        <div className="font-medium">Wanderer details</div>
                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                            {Object.entries(order.client_details)
                                                .filter(
                                                    ([field, value]) =>
                                                        field !== 'nickname' && Boolean(value)
                                                )
                                                .map(([field, value]) => (
                                                    <InfoRow
                                                        key={field}
                                                        label={clientDetailLabel(field)}
                                                        value={value}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(quoteDetails)}
                onOpenChange={(open) => !open && setQuoteDetails(null)}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            Commission Quote · Version {quoteDetails?.version ?? '-'}
                        </DialogTitle>
                    </DialogHeader>
                    {quoteDetails && (
                        <div className="space-y-4 text-sm">
                            <div className="rounded-xl border bg-muted/20 p-4">
                                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    Quote amount
                                </div>
                                <div className="mt-1 text-2xl font-bold">
                                    {quoteDetails.quote_credits} credits
                                </div>
                                <div className="mt-2 text-xs capitalize text-muted-foreground">
                                    Status: {quoteDetails.status.replace(/_/g, ' ')}
                                </div>
                            </div>
                            {quoteDetails.quote_note && (
                                <div>
                                    <div className="font-semibold">Artist note</div>
                                    <p className="mt-1 whitespace-pre-line text-muted-foreground">
                                        {quoteDetails.quote_note}
                                    </p>
                                </div>
                            )}
                            {quoteDetails.renegotiation_reason && (
                                <div className="rounded-xl border p-4">
                                    <div className="font-semibold">New quote request</div>
                                    <p className="mt-2 whitespace-pre-line text-muted-foreground">
                                        {quoteDetails.renegotiation_reason}
                                    </p>
                                    {quoteDetails.preferred_credits !== null && (
                                        <p className="mt-2">
                                            Preferred budget: {quoteDetails.preferred_credits}{' '}
                                            credits
                                        </p>
                                    )}
                                    {quoteDetails.requested_changes && (
                                        <p className="mt-2 whitespace-pre-line text-muted-foreground">
                                            Requested changes: {quoteDetails.requested_changes}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div>
                                <div className="font-semibold">Commission flow</div>
                                <div className="mt-2 space-y-2">
                                    {quoteDetails.flow_snapshot.map((step, index) => (
                                        <div
                                            key={`${step.label}-${index}`}
                                            className="rounded-lg border px-3 py-2"
                                        >
                                            <span className="font-medium">
                                                {index + 1}. {step.label}
                                            </span>
                                            {typeof step.percent === 'number' && (
                                                <span className="ml-2 text-muted-foreground">
                                                    {step.percent}%
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {hasQuoteHistory ? 'Change quote' : 'Create quote'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {latestQuote?.status === 'renegotiation_requested' && (
                            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                                <div className="font-semibold">Wanderer requested a new quote</div>
                                {latestQuote.preferred_credits !== null && (
                                    <p className="mt-2">
                                        Preferred budget: {latestQuote.preferred_credits} credits
                                    </p>
                                )}
                                {latestQuote.renegotiation_reason && (
                                    <p className="mt-2 whitespace-pre-line text-muted-foreground">
                                        Reason: {latestQuote.renegotiation_reason}
                                    </p>
                                )}
                                {latestQuote.requested_changes && (
                                    <p className="mt-2 whitespace-pre-line text-muted-foreground">
                                        Requested changes: {latestQuote.requested_changes}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="grid gap-1.5">
                            <Label>Quote credits</Label>
                            <Input
                                type="number"
                                min={0}
                                value={quoteCredits}
                                onChange={(event) =>
                                    setQuoteCredits(Number(event.target.value) || 0)
                                }
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Quote note</Label>
                            <Textarea
                                value={quoteNote}
                                onChange={(event) => setQuoteNote(event.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuoteOpen(false)}>
                            Cancel
                        </Button>
                        <Button disabled={quoteOrder.isPending} onClick={() => quoteOrder.mutate()}>
                            {quoteOrder.isPending
                                ? 'Sending...'
                                : hasQuoteHistory
                                  ? 'Send changed quote'
                                  : 'Send quote'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(renegotiationQuote)}
                onOpenChange={(open) => !open && setRenegotiationQuote(null)}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Request a New Quote</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid gap-1.5">
                            <Label>Reason</Label>
                            <Textarea
                                value={renegotiationReason}
                                onChange={(event) => setRenegotiationReason(event.target.value)}
                                className="min-h-28"
                                placeholder="Explain why you need a changed quote."
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Preferred budget — optional</Label>
                            <Input
                                type="number"
                                min={0}
                                value={preferredCredits}
                                onChange={(event) => setPreferredCredits(event.target.value)}
                                placeholder="70"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Requested changes — optional</Label>
                            <Textarea
                                value={requestedChanges}
                                onChange={(event) => setRequestedChanges(event.target.value)}
                                placeholder="Example: remove the detailed background."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenegotiationQuote(null)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                requestNewQuote.isPending || renegotiationReason.trim().length < 5
                            }
                            onClick={() => requestNewQuote.mutate()}
                        >
                            {requestNewQuote.isPending ? 'Sending...' : 'Send Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(rejectQuoteTarget)}
                onOpenChange={(open) => !open && setRejectQuoteTarget(null)}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Reject Commission Quote</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            This rejects only the current quote. It does not cancel the commission
                            request.
                        </p>
                        <div className="grid gap-1.5">
                            <Label>Reason — optional</Label>
                            <Textarea
                                value={quoteRejectionReason}
                                onChange={(event) => setQuoteRejectionReason(event.target.value)}
                                placeholder="Explain why you rejected this quote."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectQuoteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={rejectQuote.isPending}
                            onClick={() => rejectQuote.mutate()}
                        >
                            {rejectQuote.isPending ? 'Rejecting...' : 'Reject Quote'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isArtist && stageOpen} onOpenChange={setStageOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update stage</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid gap-1.5">
                            <Label>Stage</Label>
                            <select
                                value={stageIndex}
                                onChange={(event) => setStageIndex(Number(event.target.value))}
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                            >
                                {(order?.flow_snapshot ?? []).map((step, index) => (
                                    <option key={`${step.label}-${index}`} value={index}>
                                        {step.label}
                                        {step.rounds ? ` (${step.rounds} attempts)` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Textarea
                            value={stageNote}
                            onChange={(event) => setStageNote(event.target.value)}
                            placeholder="Stage note for this update."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStageOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={advanceStage.isPending || !order?.flow_snapshot?.length}
                            onClick={() => advanceStage.mutate()}
                        >
                            Save stage
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Need adjustments</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Textarea
                            value={revisionReason}
                            onChange={(event) => setRevisionReason(event.target.value)}
                            className="min-h-32"
                            placeholder="Explain what needs adjustment."
                        />
                        <div className="grid gap-1.5">
                            <Label>Return to stage</Label>
                            <select
                                value={revisionStepIndex}
                                onChange={(event) =>
                                    setRevisionStepIndex(Number(event.target.value))
                                }
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                            >
                                {creativeSteps(order).map(({ step, index }) => (
                                    <option key={`${step.label}-${index}`} value={index}>
                                        {step.label} · {attemptText(order!, index, step)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevisionOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={requestRevision.isPending || revisionReason.trim().length < 5}
                            onClick={() => requestRevision.mutate(false)}
                        >
                            Send adjustment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={extraAttemptOpen} onOpenChange={setExtraAttemptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>No attempts left</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>You have used all included attempts for this stage.</p>
                        <p>
                            Pay {order?.extra_attempt_credits ?? 1} credits for an extra attempt, or
                            continue the original flow.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExtraAttemptOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={requestRevision.isPending || revisionReason.trim().length < 5}
                            onClick={() => requestRevision.mutate(true)}
                        >
                            Pay extra attempt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={uploadTypeOpen} onOpenChange={setUploadTypeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Image upload type</DialogTitle>
                    </DialogHeader>
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
                                <span className="mt-1 block text-xs normal-case text-muted-foreground">
                                    {uploadTypeDescription(type)}
                                </span>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(imagePreview)}
                onOpenChange={(open) => !open && setImagePreview(null)}
            >
                <DialogContent className="h-[92dvh] !w-[min(96vw,1320px)] !max-w-none overflow-hidden p-0">
                    <DialogHeader className="border-b px-4 py-3">
                        <DialogTitle>{imagePreview?.title ?? 'Image'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex min-h-0 flex-1 items-center justify-center bg-muted p-4">
                        {imagePreview && (
                            <img
                                src={imagePreview.src}
                                alt=""
                                className="max-h-[78dvh] max-w-full object-contain"
                                draggable={false}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
