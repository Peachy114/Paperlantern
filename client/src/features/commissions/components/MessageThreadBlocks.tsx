import { useEffect, useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { commissionApi } from '@/api/commissions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { RoyaltyDesignAsset } from '@/types/artistProfile'
import { storageUrl } from '@/utils/storage'
import type {
    CommissionQuote,
    CommissionQuoteStatus,
    CommissionRevision,
    Message,
    MessagePreferences,
    OrderInfo,
    Thread,
} from '@/features/commissions/types/messages'

// Message thread presentation ----
export function ServiceHistoryPanel({
    order,
    threads,
    selectedId,
    onSelect,
    onViewDetails,
}: {
    order: OrderInfo | null
    threads: Thread[]
    selectedId: string | null
    onSelect: (id: string) => void
    onViewDetails: () => void
}) {
    return (
        <aside className="hidden min-h-0 overflow-y-auto border-l bg-muted/20 p-4 lg:block">
            <div className="mb-4">
                <h2 className="text-sm font-bold">Service History</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    Active commission threads with this person.
                </p>
            </div>

            {order && (
                <div className="mb-4 rounded-xl border bg-background p-3 text-xs">
                    <div className="font-semibold">{order.service?.title ?? 'Commission'}</div>
                    <div className="mt-2 grid gap-1 text-muted-foreground">
                        <span>Status: {order.status.replace('_', ' ')}</span>
                        <span>Quote: {order.quote_credits} credits</span>
                        <span>Paid: {order.escrow_credits} credits</span>
                        <span>
                            Due: {Math.max(0, order.quote_credits - order.escrow_credits)} credits
                        </span>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full"
                        onClick={onViewDetails}
                    >
                        View Details
                    </Button>
                </div>
            )}

            <div className="space-y-2">
                {threads.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-background/60 p-4 text-xs text-muted-foreground">
                        No active commission history yet.
                    </div>
                ) : (
                    threads.map((thread) => (
                        <button
                            key={thread.id}
                            type="button"
                            onClick={() => onSelect(thread.id)}
                            className={`w-full rounded-xl border bg-background p-3 text-left text-xs transition hover:bg-muted ${
                                selectedId === thread.id
                                    ? 'border-primary ring-2 ring-primary/20'
                                    : ''
                            }`}
                        >
                            <div className="font-semibold">
                                {thread.service?.title ?? 'Commission'}
                            </div>
                            <div className="mt-1 text-muted-foreground">
                                {thread.status.replace('_', ' ')} - {thread.escrow_credits}/
                                {thread.quote_credits} credits
                            </div>
                        </button>
                    ))
                )}
            </div>
        </aside>
    )
}

export function CommissionRequestBlock({
    order,
    latestQuote,
    hasQuoteHistory,
    isArtist,
    busy,
    onViewDetails,
    onQuote,
    onCancel,
}: {
    order: OrderInfo
    latestQuote: CommissionQuote | null
    hasQuoteHistory: boolean
    isArtist: boolean
    busy: boolean
    onViewDetails: () => void
    onQuote: () => void
    onCancel: () => void
}) {
    const requestActive = ['requested', 'quoted'].includes(order.status)
    const accepted = ['in_progress', 'delivered', 'completed'].includes(order.status)

    let statusText = isArtist ? 'Waiting for your quote' : 'Waiting for artist quote'

    if (accepted || latestQuote?.status === 'accepted') {
        statusText = 'Commission Quote Accepted.'
    } else if (latestQuote?.status === 'renegotiation_requested') {
        statusText = isArtist ? 'Wanderer requested a new quote' : 'Waiting for artist new quote'
    } else if (latestQuote?.status === 'pending') {
        statusText = isArtist ? 'Waiting for Wanderer response' : 'Commission quote received'
    } else if (latestQuote?.status === 'rejected') {
        statusText = isArtist
            ? 'Quote rejected · create a new quote'
            : 'Quote rejected · waiting for artist'
    }

    return (
        <CenteredBlock>
            <div className="font-semibold">Commission Request</div>
            <div className="mt-1 text-sm text-muted-foreground">{statusText}</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button size="sm" variant="outline" onClick={onViewDetails}>
                    View Details
                </Button>
                {isArtist && requestActive && (
                    <Button size="sm" disabled={busy} onClick={onQuote}>
                        {hasQuoteHistory ? 'Change Quote' : 'Create Quote'}
                    </Button>
                )}
                {requestActive && (
                    <Button size="sm" variant="destructive" disabled={busy} onClick={onCancel}>
                        {isArtist ? 'Cancel Commission' : 'Cancel Request'}
                    </Button>
                )}
            </div>
        </CenteredBlock>
    )
}

export function CommissionQuoteBlock({
    quote,
    isLatest,
    isArtist,
    busy,
    onViewDetails,
    onChangeQuote,
    onAccept,
    onRequestNew,
    onReject,
}: {
    quote: CommissionQuote
    isLatest: boolean
    isArtist: boolean
    busy: boolean
    onViewDetails: () => void
    onChangeQuote: () => void
    onAccept: () => void
    onRequestNew: () => void
    onReject: () => void
}) {
    const statusText: Record<CommissionQuoteStatus, string> = {
        pending: isArtist ? 'Waiting for Wanderer response' : 'Review this quote',
        renegotiation_requested: isArtist
            ? 'Wanderer requested a new quote'
            : 'New Quote Requested',
        superseded: 'Superseded by a newer quote',
        accepted: 'Accepted',
        rejected: 'Rejected',
        withdrawn: 'Withdrawn',
    }

    return (
        <CenteredBlock>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Commission Quote · Version {quote.version}
            </div>
            <div className="mt-2 text-2xl font-bold">{quote.quote_credits} credits</div>
            {quote.quote_note && (
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                    {quote.quote_note}
                </p>
            )}
            <div className="mt-2 text-xs text-muted-foreground">{statusText[quote.status]}</div>
            <div className="mt-3 grid gap-2">
                <Button size="sm" variant="outline" onClick={onViewDetails}>
                    View Details
                </Button>

                {quote.status === 'pending' && isLatest && !isArtist && (
                    <>
                        <Button size="sm" disabled={busy} onClick={onAccept}>
                            Accept Quote
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={onRequestNew}>
                            Request New Quote
                        </Button>
                        <Button size="sm" variant="destructive" disabled={busy} onClick={onReject}>
                            Reject Quote
                        </Button>
                    </>
                )}

                {quote.status === 'pending' && isLatest && isArtist && (
                    <Button size="sm" disabled={busy} onClick={onChangeQuote}>
                        Change Quote
                    </Button>
                )}

                {quote.status === 'renegotiation_requested' && isLatest && isArtist && (
                    <Button size="sm" disabled={busy} onClick={onChangeQuote}>
                        Create New Quote
                    </Button>
                )}

                {quote.status === 'renegotiation_requested' && !isArtist && (
                    <Button size="sm" variant="outline" disabled>
                        New Quote Requested
                    </Button>
                )}

                {quote.status === 'rejected' && isLatest && isArtist && (
                    <Button size="sm" disabled={busy} onClick={onChangeQuote}>
                        Create New Quote
                    </Button>
                )}

                {['accepted', 'rejected', 'superseded', 'withdrawn'].includes(quote.status) && (
                    <Button size="sm" variant="outline" disabled>
                        {quote.status === 'accepted'
                            ? 'Accepted'
                            : quote.status === 'rejected'
                              ? 'Rejected'
                              : quote.status === 'superseded'
                                ? 'Superseded'
                                : 'Withdrawn'}
                    </Button>
                )}
            </div>
        </CenteredBlock>
    )
}

export function SystemMessageBlock({ message }: { message: Message }) {
    return (
        <div className="flex justify-center">
            <div className="max-w-lg rounded-xl border bg-muted/60 px-4 py-3 text-center text-sm">
                <p className="whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {message.body}
                </p>
            </div>
        </div>
    )
}

export function AdjustmentMessage({ revision }: { revision: CommissionRevision }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-center">
                <div className="rounded-full bg-muted px-4 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    --- Adjustment ---
                </div>
            </div>
            <div className="flex justify-center">
                <div className="w-fit max-w-[76%] rounded-xl bg-muted px-4 py-2 text-center text-sm">
                    <p className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        {revision.reason}
                    </p>
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

export function StageSubmissionBlock({
    message,
    mine,
    needsAdjustment,
    isArtist,
    busy,
    onApprove,
    onAdjustment,
    onPreview,
}: {
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
    const statusText = needsAdjustment
        ? 'Need adjustment'
        : (message.approval_status ?? 'submitted')

    return (
        <AlignedBlock mine={mine}>
            <div className="font-semibold">Image Submitted</div>
            <div className="mt-1 text-sm capitalize text-muted-foreground">
                {message.upload_type}
            </div>
            {imageSrc && (
                <button
                    type="button"
                    className="mx-auto mt-3 block h-32 w-32 overflow-hidden rounded-lg bg-muted"
                    onClick={() => onPreview(imageSrc, `${message.upload_type} image`)}
                >
                    <img src={imageSrc} alt="" className="h-full w-full object-cover" />
                </button>
            )}
            {message.approval_status === 'pending' && !needsAdjustment && !isArtist ? (
                <div className="mt-3 grid gap-2">
                    <Button size="sm" disabled={busy} onClick={onApprove}>
                        Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={onAdjustment}>
                        Adjustment
                    </Button>
                </div>
            ) : (
                <div className="mt-3 text-xs capitalize text-muted-foreground">{statusText}</div>
            )}
        </AlignedBlock>
    )
}

export function FinalDeliveryBlock({
    message,
    order,
    mine,
    isArtist,
    busy,
    onPayFinal,
    onArchive,
    onPreview,
}: {
    message: Message
    order: OrderInfo
    mine: boolean
    isArtist: boolean
    busy: boolean
    onPayFinal: () => void
    onArchive: () => void
    onPreview: (src: string, title: string) => void
}) {
    const [isDownloading, setIsDownloading] = useState(false)
    const file = message.delivery_file
    const finalUnlocked = order.status === 'completed' || Boolean(order.final_payment_paid_at)
    const previewSrc = file
        ? storageUrl(finalUnlocked ? file.file_path : (file.preview_path ?? file.file_path))
        : message.image_path
          ? storageUrl(message.image_path)
          : null

    const downloadOriginal = async () => {
        if (!file || isDownloading) return

        setIsDownloading(true)
        try {
            const response = await commissionApi.downloadDeliveryFile(order.id, file.id)
            const blob = response.data instanceof Blob ? response.data : new Blob([response.data])
            const objectUrl = window.URL.createObjectURL(blob)
            const anchor = document.createElement('a')

            anchor.href = objectUrl
            anchor.download = file.original_name?.trim() || `commission-${order.id}-delivery`
            anchor.style.display = 'none'
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()

            window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000)
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Could not download the original file.')
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <AlignedBlock mine={mine}>
            <div className="font-semibold">Final Art Image</div>
            <div className="mt-1 text-sm text-muted-foreground">
                {finalUnlocked ? 'Original Image' : 'Watermarked Image'}
            </div>
            {previewSrc && (
                <button
                    type="button"
                    className="mx-auto mt-3 block h-36 w-36 overflow-hidden rounded-lg bg-muted"
                    onClick={() =>
                        onPreview(
                            previewSrc,
                            finalUnlocked ? 'Final art original' : 'Final art preview'
                        )
                    }
                >
                    <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                </button>
            )}
            <div className="mt-3 grid gap-2">
                {previewSrc && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            onPreview(
                                previewSrc,
                                finalUnlocked ? 'Final art original' : 'Final art preview'
                            )
                        }
                    >
                        View
                    </Button>
                )}
                {!isArtist && !finalUnlocked && (
                    <Button type="button" size="sm" disabled={busy} onClick={onPayFinal}>
                        Final Pay
                    </Button>
                )}
                {!isArtist && finalUnlocked && file && (
                    <Button
                        type="button"
                        size="sm"
                        disabled={busy || isDownloading}
                        onClick={downloadOriginal}
                    >
                        <Download className="mr-1 h-4 w-4" />
                        {isDownloading ? 'Downloading...' : 'Download'}
                    </Button>
                )}
                {isArtist && order.status === 'completed' && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy || Boolean(order.archived_at)}
                        onClick={onArchive}
                    >
                        {order.archived_at ? 'Archived' : 'Archive'}
                    </Button>
                )}
            </div>
        </AlignedBlock>
    )
}

export function AlignedBlock({ children, mine }: { children: ReactNode; mine: boolean }) {
    return (
        <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className="w-full max-w-xs rounded-xl border bg-background p-4 text-center shadow-sm">
                {children}
            </div>
        </div>
    )
}

export function CenteredBlock({ children }: { children: ReactNode }) {
    return (
        <div className="flex justify-center">
            <div className="w-full max-w-xs rounded-xl border bg-background p-4 text-center shadow-sm">
                {children}
            </div>
        </div>
    )
}

export function MessageSettingsDialog({
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
                <DialogHeader>
                    <DialogTitle>Message settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={draft.message_read_receipts_enabled}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    message_read_receipts_enabled: event.target.checked,
                                }))
                            }
                        />
                        Read receipts
                    </label>
                    <AssetPicker
                        label="Message Design"
                        value={draft.message_design_id}
                        assets={designs}
                        onChange={(message_design_id) =>
                            setDraft((current) => ({ ...current, message_design_id }))
                        }
                    />
                    <AssetPicker
                        label="Message Background"
                        value={draft.message_background_id}
                        assets={backgrounds}
                        onChange={(message_background_id) =>
                            setDraft((current) => ({ ...current, message_background_id }))
                        }
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button disabled={busy} onClick={() => onSave(draft)}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function AssetPicker({
    label,
    value,
    assets,
    onChange,
}: {
    label: string
    value: string | null
    assets: RoyaltyDesignAsset[]
    onChange: (id: string | null) => void
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className={`flex h-20 items-center justify-center rounded-lg border text-xs ${!value ? 'border-primary bg-primary/10' : ''}`}
                >
                    Default
                </button>
                {assets.map((asset) => (
                    <button
                        key={asset.id}
                        type="button"
                        onClick={() => onChange(asset.id)}
                        className={`overflow-hidden rounded-lg border ${value === asset.id ? 'border-primary ring-2 ring-primary/30' : ''}`}
                        title={asset.name}
                    >
                        <img
                            src={storageUrl(asset.image_path)!}
                            alt={asset.name}
                            className="h-20 w-full object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    )
}

export function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b pb-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium capitalize">{value}</span>
        </div>
    )
}

export function clientDetailLabel(field: string) {
    return (
        (
            {
                name: 'Name',
                username: 'Username',
                email: 'Email',
                discord: 'Discord',
                twitter: 'Twitter / X',
                instagram: 'Instagram',
                facebook: 'Facebook',
                tiktok: 'TikTok',
            } as Record<string, string>
        )[field] ?? field
    )
}
