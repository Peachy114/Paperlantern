import { useState } from 'react'
import { Archive, BriefcaseBusiness, CheckCircle2, Clock3, GripVertical, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CommissionProfile } from '@/types/art'
import type { ClientFields, CommissionOrder, FlowStep } from '@/features/commissions/types/studioCommission'
import { RadioCard } from '@/features/commissions/components/ServiceFormFields'
import { ClientFieldsSection, CommissionAccordion } from '@/features/commissions/components/ServiceEditorSections'
import { FlowEditor } from '@/features/commissions/components/CommissionFlowEditor'
import { normalizeClientFields, normalizeFlowTemplate } from '@/features/commissions/utils/serviceForm'
import {
    isProductionOrder,
    productionColumnForOrder,
    productionProgressLabel,
} from '@/features/commissions/utils/productionBoard'

// Commission overview sections ----
export function CommissionWorkflowSection({
    orders,
    busy,
    onMove,
    onArchive,
}: {
    orders: CommissionOrder[]
    busy: boolean
    onMove: (
        id: string,
        status: 'in_progress' | 'delivered' | 'cancelled' | 'disputed',
        board_column: 'todo' | 'in_progress' | 'done'
    ) => void
    onArchive: (id: string) => void
}) {
    const columns = [
        {
            key: 'todo',
            title: 'TODO',
        },
        {
            key: 'in_progress',
            title: 'IN-PROGRESS',
        },
        {
            key: 'done',
            title: 'DONE',
        },
    ]

    const statusForColumn = (key: string): 'in_progress' | 'delivered' | null => {
        if (key === 'todo') return 'in_progress'
        if (key === 'in_progress') return 'in_progress'
        if (key === 'done') return 'delivered'
        return null
    }

    return (
        <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-100/80 via-background to-orange-50/70 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.055)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-base font-black tracking-tight">Commissions</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Accepted work appears here. New requests and quotes stay in Orders and
                        Messages until accepted.
                    </p>
                </div>
                <span className="rounded-full border border-border bg-background/85 px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-sm">
                    {orders.filter(isProductionOrder).length} active board item
                    {orders.filter(isProductionOrder).length === 1 ? '' : 's'}
                </span>
            </div>

            <div className="overflow-x-auto pb-1">
                <div className="grid min-w-[790px] grid-cols-3 gap-3">
                    {columns.map((column) => {
                        const columnOrders = orders.filter(
                            (order) => productionColumnForOrder(order) === column.key
                        )
                        const nextStatus = statusForColumn(column.key)

                        return (
                            <div
                                key={column.key}
                                onDragOver={(event) => {
                                    if (nextStatus) event.preventDefault()
                                }}
                                onDrop={(event) => {
                                    if (!nextStatus) return
                                    const id = event.dataTransfer.getData('text/plain')
                                    if (id) {
                                        onMove(
                                            id,
                                            nextStatus,
                                            column.key as 'todo' | 'in_progress' | 'done'
                                        )
                                    }
                                }}
                                className="min-h-[420px] rounded-2xl bg-background/25 p-1"
                            >
                                <div className="mb-3 flex items-center justify-between px-1">
                                    <h3 className="text-[11px] font-black tracking-[0.08em] text-slate-800">
                                        {column.title}
                                    </h3>
                                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                        {columnOrders.length}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {columnOrders.length === 0 ? (
                                        <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-border bg-background/50 px-4 text-center text-xs text-muted-foreground">
                                            No commissions in this column.
                                        </div>
                                    ) : (
                                        columnOrders.map((order) => {
                                            const canDrag =
                                                !busy &&
                                                !['completed', 'cancelled', 'delivered'].includes(
                                                    order.status
                                                )
                                            const progressLabel = productionProgressLabel(order)

                                            return (
                                                <article
                                                    key={order.id}
                                                    draggable={canDrag}
                                                    onDragStart={(event) =>
                                                        event.dataTransfer.setData(
                                                            'text/plain',
                                                            order.id
                                                        )
                                                    }
                                                    className={`rounded-2xl border border-border bg-background p-3 shadow-[0_7px_20px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${
                                                        canDrag
                                                            ? 'cursor-grab active:cursor-grabbing'
                                                            : 'cursor-default'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <h4 className="truncate text-xs font-black">
                                                                {order.service?.title ??
                                                                    'Commission request'}
                                                            </h4>
                                                            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                                                                {order.request_message ||
                                                                    'No request description was provided.'}
                                                            </p>
                                                        </div>
                                                        <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-[9px] font-semibold text-sky-500">
                                                            {order.customer?.name ?? 'Wanderer'}
                                                        </span>
                                                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] capitalize text-muted-foreground">
                                                            {progressLabel}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 border-t border-slate-100 pt-2 text-[9px] text-muted-foreground">
                                                        {Number(order.quote_credits || 0).toFixed(
                                                            0
                                                        )}{' '}
                                                        credits ·{' '}
                                                        {Number(order.escrow_credits || 0).toFixed(
                                                            0
                                                        )}{' '}
                                                        paid
                                                    </div>
                                                    {column.key === 'done' && (
                                                        <div className="mt-3 border-t border-slate-100 pt-2">
                                                            {order.status === 'delivered' ? (
                                                                <p className="text-[10px] font-semibold text-orange-600">
                                                                    Waiting for wanderer acceptance
                                                                    or final payment.
                                                                </p>
                                                            ) : (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={busy || Boolean(order.archived_at)}
                                                                    onClick={() => onArchive(order.id)}
                                                                    className="h-8 w-full text-xs"
                                                                >
                                                                    <Archive className="h-3.5 w-3.5" />
                                                                    {order.archived_at
                                                                        ? 'Archived'
                                                                        : 'Archive'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </article>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export function CommissionApplicationSection({
    profile,
    busy,
    onApply,
}: {
    profile: CommissionProfile
    busy: boolean
    onApply: (reason: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState(profile.application_reason ?? '')
    const canApply = ['not_applied', 'rejected'].includes(profile.application_status)

    const submit = () => {
        if (reason.trim().length < 20) {
            toast.error('Please tell us why you want to apply. Minimum 20 characters.')
            return
        }
        onApply(reason.trim())
        setOpen(false)
    }

    const copy = {
        not_applied: 'Apply to become a commission artist before creating services.',
        pending: 'Your commission artist application is waiting for admin review.',
        approved: 'Your commission artist access is approved.',
        rejected: 'Your commission application needs changes. You can apply again.',
        suspended: 'Your commission access is suspended. Please contact support to appeal.',
    }[profile.application_status]

    return (
        <section className="rounded-[24px] border border-border bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {profile.application_status === 'approved' ? (
                            <CheckCircle2 className="h-5 w-5" />
                        ) : profile.application_status === 'pending' ? (
                            <Clock3 className="h-5 w-5" />
                        ) : profile.application_status === 'suspended' ? (
                            <ShieldAlert className="h-5 w-5" />
                        ) : (
                            <BriefcaseBusiness className="h-5 w-5" />
                        )}
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold">Commission application</h2>
                            <span className="rounded-md border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                {profile.application_status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
                    </div>
                </div>
                {canApply && (
                    <Button type="button" onClick={() => setOpen(true)}>
                        Apply
                    </Button>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Apply as a commission artist</DialogTitle>
                        <DialogDescription>
                            Review the commission program terms, then tell us why you want to join.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <CommissionAccordion title="Benefits">
                            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                <li>
                                    Show commission offers in the public Commission browse page.
                                </li>
                                <li>Receive quote-based requests before credits are charged.</li>
                                <li>Use escrow-style protection for paid commission milestones.</li>
                                <li>Build public commission ratings after completed orders.</li>
                            </ul>
                        </CommissionAccordion>
                        <CommissionAccordion title="Admin terms">
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    LaterNComix admin terms apply to every commission, payment,
                                    refund, cancellation, dispute, and rating.
                                </p>
                                <p className="font-medium text-foreground">
                                    Your own artist terms cannot override the admin terms.
                                </p>
                            </div>
                        </CommissionAccordion>
                        <CommissionAccordion title="Wanderer commission terms">
                            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                <li>Wanderers must see the flow and quote before confirming.</li>
                                <li>
                                    Required credits must be available before a paid request can
                                    continue.
                                </li>
                                <li>
                                    Delivered work has a 5 day review window before automatic
                                    release.
                                </li>
                                <li>
                                    Support can review disputes, cancellations, refunds, and invalid
                                    ratings.
                                </li>
                            </ul>
                        </CommissionAccordion>
                        <div>
                            <Label htmlFor="commission-application-reason">
                                Why do you want to apply?
                            </Label>
                            <Textarea
                                id="commission-application-reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                maxLength={1000}
                                placeholder="Tell admin about your commission experience, what you plan to offer, and how you will handle clients."
                                className="mt-1 min-h-32"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                {reason.length}/1000 characters. Minimum 20 characters.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={submit} disabled={busy}>
                            {busy ? 'Submitting...' : 'Submit application'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

export function CommissionSettingsSection({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (payload: {
        commissions_enabled: boolean
        commission_status: 'open' | 'closed'
        client_fields: ClientFields
        flow_template: FlowStep[]
    }) => void
}) {
    const [status, setStatus] = useState<'open' | 'closed'>(
        profile.commission_status === 'open' ? 'open' : 'closed'
    )
    const [clientFields, setClientFields] = useState<ClientFields>(
        normalizeClientFields(profile.client_fields)
    )
    const [flow, setFlow] = useState<FlowStep[]>(normalizeFlowTemplate(profile.flow_template))
    const approved = profile.application_status === 'approved'

    const updateClientField = (
        field: keyof ClientFields,
        patch: Partial<ClientFields[keyof ClientFields]>
    ) => {
        setClientFields((current) => ({
            ...current,
            [field]: { ...current[field], ...patch },
        }))
    }

    const updateFlowStep = (index: number, patch: Partial<FlowStep>) => {
        setFlow((current) =>
            current.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step))
        )
    }

    const moveFlowStep = (index: number, target: number) => {
        setFlow((current) => {
            if (target < 0 || target >= current.length) return current
            const next = [...current]
            const [item] = next.splice(index, 1)
            next.splice(target, 0, item)
            return next
        })
    }

    return (
        <section className="rounded-[24px] border border-border bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4">
                <h2 className="text-base font-semibold">Commission settings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Control global commission availability, required client details, and the default
                    flow used for new services.
                </p>
            </div>

            <div className={!approved ? 'pointer-events-none opacity-50' : ''}>
                <Tabs defaultValue="availability" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="availability">Availability</TabsTrigger>
                        <TabsTrigger value="client">Client Details</TabsTrigger>
                        <TabsTrigger value="flow">Flow</TabsTrigger>
                    </TabsList>

                    <TabsContent value="availability" className="rounded-lg border p-3">
                        <Label>Commissions status</Label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <RadioCard
                                checked={status === 'open'}
                                title="Open"
                                description="All published open services can receive requests."
                                onChange={() => setStatus('open')}
                            />
                            <RadioCard
                                checked={status === 'closed'}
                                title="Closed"
                                description="Globally close commission requests for every service."
                                onChange={() => setStatus('closed')}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="client">
                        <ClientFieldsSection fields={clientFields} onUpdate={updateClientField} />
                    </TabsContent>

                    <TabsContent value="flow">
                        <FlowEditor
                            flow={flow}
                            setFlow={setFlow}
                            onUpdate={updateFlowStep}
                            onMove={moveFlowStep}
                        />
                    </TabsContent>
                </Tabs>

                <Button
                    type="button"
                    className="mt-4"
                    disabled={busy || !approved}
                    onClick={() =>
                        onSave({
                            commissions_enabled: status === 'open',
                            commission_status: status,
                            client_fields: clientFields,
                            flow_template: flow,
                        })
                    }
                >
                    {busy ? 'Saving...' : 'Save settings'}
                </Button>
            </div>
        </section>
    )
}


