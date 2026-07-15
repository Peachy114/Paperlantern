import { useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    BriefcaseBusiness,
    CheckCircle2,
    ChevronDown,
    Clock3,
    ImageOff,
    PlusCircle,
    ShieldAlert,
    Sparkles,
    Trash2,
} from 'lucide-react'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import type { CommissionProfile } from '@/types/art'
import BoostModal from '@/features/boosts/components/BoostModal'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const QUERY_KEY = ['studio-commission-profile']

type ServiceStatus = 'open' | 'waitlist' | 'closed' | 'paused'
type FlowType = 'pay' | 'sketch' | 'revision' | 'add' | 'done'

interface CommissionCategory {
    id: string
    name: string
    slug: string
}

interface FlowStep {
    type: FlowType
    label: string
    percent?: number
    rounds?: number
}

interface CommissionService {
    id: string
    title: string
    slug: string
    description: string | null
    image_path: string | null
    base_price_credits: number
    min_price_credits: number | null
    delivery_days: number | null
    slots_available: number | null
    status: ServiceStatus
    flow: FlowStep[]
    terms: string | null
    quote_rules: string | null
    refund_policy: string | null
    required_references: string | null
    is_published: boolean
    boosted_until?: string | null
    commission_category_id: string | null
    category: CommissionCategory | null
}

interface CommissionPageResponse {
    commission_profile: CommissionProfile
    categories: CommissionCategory[]
    services: CommissionService[]
    orders: CommissionOrder[]
    ratings: CommissionRating[]
    widgets: CommissionWidgetsData
}

interface CommissionWidgetsData {
    total_orders: number
    active_orders: number
    completed_orders: number
    commission_earnings: number
    works_earnings: number
    arts_earnings: number
    super_like_earnings: number
    combined_creator_earnings: number
}

interface CommissionOrder {
    id: string
    status: 'requested' | 'awaiting_payment' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'disputed'
    request_message: string | null
    reference_notes: string | null
    quote_credits: number
    credits_checked: number
    escrow_credits: number
    released_credits: number
    refunded_credits: number
    quote_note: string | null
    flow_snapshot: FlowStep[]
    paid_steps: number[]
    stage_notes: Record<string, { note: string; at: string }>
    current_step_index: number
    auto_release_at: string | null
    payment_due_at: string | null
    quote_accepted_at: string | null
    revision_limit: number
    revisions: CommissionRevision[]
    delivery_files: CommissionDeliveryFile[]
    created_at: string
    service: {
        id: string
        title: string
        slug: string
        image_path: string | null
    } | null
    customer: {
        id: string
        name: string
        username: string
        avatar: string | null
    } | null
}

interface CommissionRevision {
    id: string
    reason: string
    revision_number: number
    status: 'requested' | 'in_progress' | 'resolved' | 'rejected'
    artist_response: string | null
    created_at: string
}

interface CommissionDeliveryFile {
    id: string
    file_path: string
    preview_path?: string | null
    original_name: string | null
    note: string | null
    moderation_status: 'pending' | 'approved' | 'suspended'
    created_at: string
}

interface CommissionRating {
    id: string
    rating: number
    comment: string | null
    status: 'published' | 'appealed' | 'hidden'
    appeal_reason: string | null
    created_at: string
    service: { title: string; slug: string } | null
    customer: { name: string; username: string; avatar: string | null } | null
}

interface ServiceForm {
    title: string
    commission_category_id: string
    description: string
    image: File | null
    imagePreview: string | null
    base_price_credits: number
    min_price_credits: number
    delivery_days: number
    slots_available: number
    status: ServiceStatus
    is_published: boolean
    terms: string
    quote_rules: string
    refund_policy: string
    required_references: string
    flow: FlowStep[]
}

const EMPTY_SERVICE_FORM: ServiceForm = {
    title: '',
    commission_category_id: '',
    description: '',
    image: null,
    imagePreview: null,
    base_price_credits: 0,
    min_price_credits: 0,
    delivery_days: 7,
    slots_available: 1,
    status: 'open',
    is_published: true,
    terms: '',
    quote_rules: '',
    refund_policy: '100% refund if no sketch/work has been sent. 50% refund once the first sketch/work has started.',
    required_references: '',
    flow: [
        { type: 'pay', label: 'Pay 50%', percent: 50 },
        { type: 'sketch', label: 'Sketch', rounds: 2 },
        { type: 'revision', label: 'Revision', rounds: 1 },
        { type: 'pay', label: 'Pay 50%', percent: 50 },
        { type: 'done', label: 'Delivery and receipt' },
    ],
}

export default function MyCommission() {
    const queryClient = useQueryClient()
    const { data, isLoading } = useQuery<CommissionPageResponse>({
        queryKey: QUERY_KEY,
        queryFn: () => studioApi.getCommissionProfile().then((res) => res.data),
    })

    const profile = data?.commission_profile
    const categories = data?.categories ?? []
    const services = data?.services ?? []
    const orders = data?.orders ?? []
    const ratings = data?.ratings ?? []
    const widgets = data?.widgets

    const applyCommission = useMutation({
        mutationFn: (application_reason: string) =>
            studioApi.applyCommission({ application_reason }).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission application submitted.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not submit commission application.'),
    })

    const updateSettings = useMutation({
        mutationFn: (payload: {
            commissions_enabled?: boolean
            commission_status?: 'open' | 'waitlist' | 'closed'
            terms?: string
        }) => studioApi.updateCommissionProfile(payload).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission settings saved.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not save commission settings.'),
    })

    const createService = useMutation({
        mutationFn: (payload: FormData) => studioApi.createCommissionService(payload),
        onSuccess: () => {
            toast.success('Commission service created.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not save commission service.'),
    })

    const updateService = useMutation({
        mutationFn: ({ slug, payload }: { slug: string; payload: FormData }) =>
            studioApi.updateCommissionService(slug, payload),
        onSuccess: () => {
            toast.success('Commission service updated.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not update commission service.'),
    })

    const deleteService = useMutation({
        mutationFn: (slug: string) => studioApi.deleteCommissionService(slug),
        onSuccess: () => {
            toast.success('Commission service deleted.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: () => toast.error('Could not delete commission service.'),
    })

    const updateOrder = useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string
            status: 'in_progress' | 'delivered' | 'cancelled' | 'disputed'
        }) => studioApi.updateCommissionOrder(id, { status }),
        onSuccess: () => {
            toast.success('Commission request updated.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: () => toast.error('Could not update commission request.'),
    })

    const quoteOrder = useMutation({
        mutationFn: ({
            id,
            quote_credits,
            quote_note,
            flow,
        }: {
            id: string
            quote_credits: number
            quote_note?: string
            flow: FlowStep[]
        }) => studioApi.quoteCommissionOrder(id, { quote_credits, quote_note, flow }),
        onSuccess: () => {
            toast.success('Commission quote sent.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not send quote.'),
    })

    const advanceStage = useMutation({
        mutationFn: ({ id, step_index, note }: { id: string; step_index: number; note?: string }) =>
            studioApi.advanceCommissionStage(id, { step_index, note }),
        onSuccess: () => {
            toast.success('Commission stage updated.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not update stage.'),
    })

    const uploadDelivery = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: FormData }) =>
            studioApi.uploadCommissionDeliveryFile(id, payload).then((res) => res.data),
        onSuccess: () => {
            toast.success('Final delivery uploaded.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not upload delivery file.'),
    })

    const updateRevision = useMutation({
        mutationFn: ({
            id,
            status,
            artist_response,
        }: {
            id: string
            status: 'in_progress' | 'resolved' | 'rejected'
            artist_response?: string
        }) => studioApi.updateCommissionRevision(id, { status, artist_response }).then((res) => res.data),
        onSuccess: () => {
            toast.success('Revision updated.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not update revision.'),
    })

    const appealRating = useMutation({
        mutationFn: ({ id, appeal_reason }: { id: string; appeal_reason: string }) =>
            studioApi.appealCommissionRating(id, appeal_reason).then((res) => res.data),
        onSuccess: () => {
            toast.success('Rating appeal sent to admin.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not appeal rating.'),
    })

    if (isLoading || !profile) {
        return (
            <div className="rounded-3xl border bg-muted/30 p-8 text-sm text-muted-foreground">
                Loading commission settings...
            </div>
        )
    }

    return (
        <div className="rounded-3xl border bg-muted/30 p-5">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Commission</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Apply, create commission services, and manage your commission availability.
                    </p>
                </div>
            </div>

            <CommissionWidgets profile={profile} services={services} widgets={widgets} />

            <CommissionApplicationSection
                profile={profile}
                busy={applyCommission.isPending}
                onApply={(reason) => applyCommission.mutate(reason)}
            />

            <CommissionSettingsSection
                profile={profile}
                busy={updateSettings.isPending}
                onSave={(payload) => updateSettings.mutate(payload)}
            />

            <CommissionServicesSection
                profile={profile}
                services={services}
                categories={categories}
                saving={createService.isPending || updateService.isPending}
                deleting={deleteService.isPending}
                onCreate={(payload) => createService.mutate(payload)}
                onUpdate={(slug, payload) => updateService.mutate({ slug, payload })}
                onDelete={(slug) => deleteService.mutate(slug)}
            />

            <CommissionRequestsSection
                orders={orders}
                busy={updateOrder.isPending || quoteOrder.isPending || advanceStage.isPending || uploadDelivery.isPending || updateRevision.isPending}
                onUpdate={(id, status) => updateOrder.mutate({ id, status })}
                onQuote={(id, quote_credits, quote_note, flow) =>
                    quoteOrder.mutate({ id, quote_credits, quote_note, flow })
                }
                onAdvance={(id, step_index, note) => advanceStage.mutate({ id, step_index, note })}
                onUploadDelivery={(id, payload) => uploadDelivery.mutate({ id, payload })}
                onUpdateRevision={(id, status, artist_response) =>
                    updateRevision.mutate({ id, status, artist_response })
                }
            />

            <CommissionRatingsSection
                ratings={ratings}
                busy={appealRating.isPending}
                onAppeal={(id, appeal_reason) => appealRating.mutate({ id, appeal_reason })}
            />
        </div>
    )
}

function CommissionWidgets({
    profile,
    services,
    widgets,
}: {
    profile: CommissionProfile
    services: CommissionService[]
    widgets?: CommissionWidgetsData
}) {
    const active = services.filter((service) => service.status === 'open' && service.is_published).length
    const waitlist = services.filter((service) => service.status === 'waitlist').length

    return (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Widget label="Total customers" value={profile.customers_count} />
            <Widget label="Average rating" value={profile.ratings_count ? profile.average_rating.toFixed(1) : 'New'} />
            <Widget label="Total orders" value={widgets?.total_orders ?? 0} />
            <Widget label="Active orders" value={widgets?.active_orders ?? 0} />
            <Widget label="Completed orders" value={widgets?.completed_orders ?? 0} />
            <Widget label="Active services" value={active} />
            <Widget label="Waitlist services" value={waitlist} />
            <Widget label="Commission earnings" value={formatCredits(widgets?.commission_earnings ?? 0)} />
            <Widget label="Works earnings" value={formatCredits(widgets?.works_earnings ?? 0)} />
            <Widget label="Arts earnings" value={formatCredits(widgets?.arts_earnings ?? 0)} />
            <Widget label="Super Likes" value={formatCredits(widgets?.super_like_earnings ?? 0)} />
            <Widget label="Creator total" value={formatCredits(widgets?.combined_creator_earnings ?? 0)} />
        </div>
    )
}

function formatCredits(value: number) {
    return `${Number(value || 0).toFixed(2)} cr`
}

function Widget({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-lg border bg-background p-4">
            <div className="text-2xl font-bold">{value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
        </div>
    )
}

function CommissionApplicationSection({
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
        <section className="mb-5 rounded-xl border bg-background p-4">
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
                                <li>Show commission offers in the public Commission browse page.</li>
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
                                <li>Required credits must be available before a paid request can continue.</li>
                                <li>Delivered work has a 5 day review window before automatic release.</li>
                                <li>Support can review disputes, cancellations, refunds, and invalid ratings.</li>
                            </ul>
                        </CommissionAccordion>
                        <div>
                            <Label htmlFor="commission-application-reason">Why do you want to apply?</Label>
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

function CommissionSettingsSection({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (payload: {
        commissions_enabled: boolean
        commission_status: 'open' | 'waitlist' | 'closed'
        terms: string
    }) => void
}) {
    const [enabled, setEnabled] = useState(profile.commissions_enabled)
    const [status, setStatus] = useState(profile.commission_status)
    const [terms, setTerms] = useState(profile.terms ?? '')
    const approved = profile.application_status === 'approved'

    return (
        <section className="mb-5 rounded-xl border bg-background p-4">
            <div className="mb-4">
                <h2 className="text-base font-semibold">Commission settings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    These settings unlock after admin approves your commission application.
                </p>
            </div>

            <div className={!approved ? 'pointer-events-none opacity-50' : ''}>
                <div className="mb-4 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) => setEnabled(event.target.checked)}
                            className="h-4 w-4"
                        />
                        Do commissions
                    </label>
                    <select
                        value={status}
                        onChange={(event) =>
                            setStatus(event.target.value as 'open' | 'waitlist' | 'closed')
                        }
                        disabled={!enabled}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="open">Open</option>
                        <option value="waitlist">Waitlist</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                <div>
                    <Label htmlFor="commission-terms">Artist commission terms</Label>
                    <Textarea
                        id="commission-terms"
                        value={terms}
                        onChange={(event) => setTerms(event.target.value)}
                        maxLength={3000}
                        placeholder="Add global commission terms. Service terms can be set per service."
                        className="mt-1 min-h-24"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        Your terms cannot override admin terms. Updates may be reviewed by admin.
                    </p>
                </div>

                <Button
                    type="button"
                    className="mt-4"
                    disabled={busy || !approved}
                    onClick={() => onSave({ commissions_enabled: enabled, commission_status: status, terms })}
                >
                    {busy ? 'Saving...' : 'Save commission settings'}
                </Button>
            </div>
        </section>
    )
}

function CommissionServicesSection({
    profile,
    services,
    categories,
    saving,
    deleting,
    onCreate,
    onUpdate,
    onDelete,
}: {
    profile: CommissionProfile
    services: CommissionService[]
    categories: CommissionCategory[]
    saving: boolean
    deleting: boolean
    onCreate: (payload: FormData) => void
    onUpdate: (slug: string, payload: FormData) => void
    onDelete: (slug: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<CommissionService | null>(null)
    const [boostService, setBoostService] = useState<CommissionService | null>(null)
    const [form, setForm] = useState<ServiceForm>(EMPTY_SERVICE_FORM)
    const approved = profile.application_status === 'approved'

    const openCreate = () => {
        setEditing(null)
        setForm(EMPTY_SERVICE_FORM)
        setOpen(true)
    }

    const openEdit = (service: CommissionService) => {
        setEditing(service)
        setForm({
            title: service.title,
            commission_category_id: service.commission_category_id ?? '',
            description: service.description ?? '',
            image: null,
            imagePreview: service.image_path ? storageUrl(service.image_path) : null,
            base_price_credits: service.base_price_credits,
            min_price_credits: service.min_price_credits ?? 0,
            delivery_days: service.delivery_days ?? 7,
            slots_available: service.slots_available ?? 1,
            status: service.status,
            is_published: service.is_published,
            terms: service.terms ?? '',
            quote_rules: service.quote_rules ?? '',
            refund_policy: service.refund_policy ?? '',
            required_references: service.required_references ?? '',
            flow: service.flow?.length ? service.flow : EMPTY_SERVICE_FORM.flow,
        })
        setOpen(true)
    }

    const submit = () => {
        if (!form.title.trim()) {
            toast.error('Commission service title is required.')
            return
        }
        const payload = buildServicePayload(form)
        if (editing) onUpdate(editing.slug, payload)
        else onCreate(payload)
        setOpen(false)
    }

    return (
        <section className="rounded-xl border bg-background p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-base font-semibold">Commission services</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create the services wanderers can browse and request.
                    </p>
                </div>
                <Button type="button" disabled={!approved} onClick={openCreate}>
                    <PlusCircle className="h-4 w-4" />
                    Add Service
                </Button>
            </div>

            {!approved ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Admin must approve your commission application before you can add services.
                </div>
            ) : services.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    <ImageOff className="mx-auto mb-2 h-6 w-6" />
                    No commission services yet. Click Add Service.
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {services.map((service) => (
                        <div key={service.id} className="rounded-lg border p-3">
                            <div className="flex gap-3">
                                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                                    {service.image_path ? (
                                        <img
                                            src={storageUrl(service.image_path)!}
                                            alt={service.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="truncate font-semibold">{service.title}</h3>
                                        <span className="rounded-md border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                            {service.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {service.base_price_credits} credits
                                        {service.delivery_days ? ` · ${service.delivery_days} days` : ''}
                                        {service.category ? ` · ${service.category.name}` : ''}
                                    </p>
                                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                        {service.description || 'No description.'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!service.is_published}
                                    onClick={() => setBoostService(service)}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Boost
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEdit(service)}>
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={deleting}
                                    onClick={() => onDelete(service.slug)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ServiceDialog
                open={open}
                onOpenChange={setOpen}
                form={form}
                setForm={setForm}
                categories={categories}
                editing={editing}
                saving={saving}
                onSubmit={submit}
            />
            {boostService && (
                <BoostModal
                    open={boostService !== null}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) setBoostService(null)
                    }}
                    kind="commission"
                    targetType="commission_service"
                    targetId={boostService.id}
                    title={boostService.title}
                    placement="Commission Explore"
                />
            )}
        </section>
    )
}

function CommissionRequestsSection({
    orders,
    busy,
    onUpdate,
    onQuote,
    onAdvance,
    onUploadDelivery,
    onUpdateRevision,
}: {
    orders: CommissionOrder[]
    busy: boolean
    onUpdate: (id: string, status: 'in_progress' | 'delivered' | 'cancelled' | 'disputed') => void
    onQuote: (id: string, quote_credits: number, quote_note: string, flow: FlowStep[]) => void
    onAdvance: (id: string, step_index: number, note: string) => void
    onUploadDelivery: (id: string, payload: FormData) => void
    onUpdateRevision: (
        id: string,
        status: 'in_progress' | 'resolved' | 'rejected',
        artist_response: string
    ) => void
}) {
    const [quoteOrder, setQuoteOrder] = useState<CommissionOrder | null>(null)
    const [quoteCredits, setQuoteCredits] = useState(0)
    const [quoteNote, setQuoteNote] = useState('')
    const [stageOrder, setStageOrder] = useState<CommissionOrder | null>(null)
    const [stageIndex, setStageIndex] = useState(0)
    const [stageNote, setStageNote] = useState('')
    const [deliveryOrder, setDeliveryOrder] = useState<CommissionOrder | null>(null)
    const [deliveryFile, setDeliveryFile] = useState<File | null>(null)
    const [deliveryNote, setDeliveryNote] = useState('')
    const [revisionResponse, setRevisionResponse] = useState<Record<string, string>>({})

    const openQuote = (order: CommissionOrder) => {
        setQuoteOrder(order)
        setQuoteCredits(order.quote_credits || 0)
        setQuoteNote(order.quote_note ?? '')
    }

    const submitQuote = () => {
        if (!quoteOrder) return
        onQuote(quoteOrder.id, quoteCredits, quoteNote, quoteOrder.flow_snapshot)
        setQuoteOrder(null)
        setQuoteNote('')
    }

    const submitStage = () => {
        if (!stageOrder) return
        onAdvance(stageOrder.id, stageIndex, stageNote)
        setStageOrder(null)
        setStageNote('')
    }

    const submitDelivery = () => {
        if (!deliveryOrder || !deliveryFile) {
            toast.error('Choose a delivery file first.')
            return
        }
        const payload = new FormData()
        payload.append('file', deliveryFile)
        payload.append('note', deliveryNote)
        onUploadDelivery(deliveryOrder.id, payload)
        setDeliveryOrder(null)
        setDeliveryFile(null)
        setDeliveryNote('')
    }

    return (
        <section className="mt-5 rounded-xl border bg-background p-4">
            <div className="mb-4">
                <h2 className="text-base font-semibold">Commission requests</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Review wanderer requests, accept work, mark delivery, or flag issues.
                </p>
            </div>
            {orders.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No commission requests yet.
                </div>
            ) : (
                <div className="grid gap-3">
                    {orders.map((order) => (
                        <div key={order.id} className="rounded-lg border p-3">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold">
                                            {order.service?.title ?? 'Commission service'}
                                        </h3>
                                        <span className="rounded-md border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        From {order.customer?.name ?? 'Wanderer'} · Quote {order.quote_credits} credits · Escrow {order.escrow_credits} credits
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
                                            Auto-release review date: {new Date(order.auto_release_at).toLocaleString()}
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
                                        <div className="mt-3 rounded-md border p-2">
                                            <p className="text-xs font-medium">Revision requests</p>
                                            <div className="mt-2 space-y-2">
                                                {order.revisions.map((revision) => (
                                                    <div key={revision.id} className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span>#{revision.revision_number}</span>
                                                            <span className="capitalize">{revision.status}</span>
                                                        </div>
                                                        <p className="mt-1 whitespace-pre-line">{revision.reason}</p>
                                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                                            <Input
                                                                value={revisionResponse[revision.id] ?? ''}
                                                                onChange={(event) =>
                                                                    setRevisionResponse((current) => ({
                                                                        ...current,
                                                                        [revision.id]: event.target.value,
                                                                    }))
                                                                }
                                                                placeholder="Artist response"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    onUpdateRevision(
                                                                        revision.id,
                                                                        'in_progress',
                                                                        revisionResponse[revision.id] ?? ''
                                                                    )
                                                                }
                                                            >
                                                                Start
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    onUpdateRevision(
                                                                        revision.id,
                                                                        'resolved',
                                                                        revisionResponse[revision.id] ?? ''
                                                                    )
                                                                }
                                                            >
                                                                Resolve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    onUpdateRevision(
                                                                        revision.id,
                                                                        'rejected',
                                                                        revisionResponse[revision.id] ?? ''
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {order.delivery_files.length > 0 && (
                                        <div className="mt-3 rounded-md border p-2 text-xs text-muted-foreground">
                                            <p className="font-medium text-foreground">Final delivery files</p>
                                            {order.delivery_files.map((file) => (
                                                <div key={file.id} className="mt-1 flex flex-wrap gap-2">
                                                    <span>{file.original_name ?? 'Delivery file'}</span>
                                                    <span className="capitalize">({file.moderation_status})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 lg:w-48 lg:flex-col">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy || ['completed', 'cancelled'].includes(order.status)}
                                        onClick={() => openQuote(order)}
                                    >
                                        Quote
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={busy || !['requested', 'awaiting_payment'].includes(order.status)}
                                        onClick={() => onUpdate(order.id, 'in_progress')}
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy || ['completed', 'cancelled'].includes(order.status)}
                                        onClick={() => setDeliveryOrder(order)}
                                    >
                                        Delivery
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy || ['completed', 'cancelled'].includes(order.status) || order.flow_snapshot.length === 0}
                                        onClick={() => {
                                            setStageOrder(order)
                                            setStageIndex(order.current_step_index)
                                        }}
                                    >
                                        Stage
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy || !['in_progress'].includes(order.status)}
                                        onClick={() => onUpdate(order.id, 'delivered')}
                                    >
                                        Mark delivered
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy || ['completed', 'cancelled'].includes(order.status)}
                                        onClick={() => onUpdate(order.id, 'disputed')}
                                    >
                                        Dispute
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={busy || ['completed', 'cancelled'].includes(order.status)}
                                        onClick={() => onUpdate(order.id, 'cancelled')}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Dialog open={Boolean(quoteOrder)} onOpenChange={(open) => !open && setQuoteOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send commission quote</DialogTitle>
                        <DialogDescription>
                            The wanderer must accept this quote before staged payments continue.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>Quote credits</Label>
                            <Input
                                type="number"
                                min={0}
                                value={quoteCredits}
                                onChange={(event) => setQuoteCredits(Number(event.target.value))}
                            />
                        </div>
                        <div>
                            <Label>Quote note</Label>
                            <Textarea
                                value={quoteNote}
                                onChange={(event) => setQuoteNote(event.target.value)}
                                className="min-h-24"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuoteOrder(null)}>
                            Cancel
                        </Button>
                        <Button disabled={busy} onClick={submitQuote}>
                            Send quote
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={Boolean(stageOrder)} onOpenChange={(open) => !open && setStageOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update commission stage</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>Stage</Label>
                            <select
                                value={stageIndex}
                                onChange={(event) => setStageIndex(Number(event.target.value))}
                                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                {(stageOrder?.flow_snapshot ?? []).map((step, index) => (
                                    <option key={`${step.label}-${index}`} value={index}>
                                        {index + 1}. {step.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Stage note</Label>
                            <Textarea
                                value={stageNote}
                                onChange={(event) => setStageNote(event.target.value)}
                                className="min-h-24"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStageOrder(null)}>
                            Cancel
                        </Button>
                        <Button disabled={busy} onClick={submitStage}>
                            Update stage
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={Boolean(deliveryOrder)} onOpenChange={(open) => !open && setDeliveryOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload final delivery</DialogTitle>
                        <DialogDescription>
                            Delivery files are separate from chat and go to moderation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>File</Label>
                            <Input
                                type="file"
                                onChange={(event) => setDeliveryFile(event.target.files?.[0] ?? null)}
                            />
                        </div>
                        <div>
                            <Label>Note</Label>
                            <Textarea
                                value={deliveryNote}
                                onChange={(event) => setDeliveryNote(event.target.value)}
                                className="min-h-24"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeliveryOrder(null)}>
                            Cancel
                        </Button>
                        <Button disabled={busy} onClick={submitDelivery}>
                            Upload delivery
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

function CommissionRatingsSection({
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
                                        <span className="font-semibold">{rating.rating}/5 stars</span>
                                        <span className="rounded-md border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                            {rating.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        From {rating.customer?.name ?? 'Wanderer'} · {rating.service?.title ?? 'Commission'}
                                    </p>
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

function ServiceDialog({
    open,
    onOpenChange,
    form,
    setForm,
    categories,
    editing,
    saving,
    onSubmit,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    form: ServiceForm
    setForm: React.Dispatch<React.SetStateAction<ServiceForm>>
    categories: CommissionCategory[]
    editing: CommissionService | null
    saving: boolean
    onSubmit: () => void
}) {
    const setField = <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const setFlowStep = (index: number, patch: Partial<FlowStep>) => {
        setForm((current) => ({
            ...current,
            flow: current.flow.map((step, stepIndex) =>
                stepIndex === index ? { ...step, ...patch } : step
            ),
        }))
    }

    const moveStep = (index: number, target: number) => {
        setForm((current) => {
            const next = [...current.flow]
            if (target < 0 || target >= next.length) return current
            const [item] = next.splice(index, 1)
            next.splice(target, 0, item)
            return { ...current, flow: next }
        })
    }

    const handleDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
        event.dataTransfer.setData('text/plain', String(index))
        event.dataTransfer.effectAllowed = 'move'
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>, targetIndex: number) => {
        event.preventDefault()
        const sourceIndex = Number(event.dataTransfer.getData('text/plain'))
        if (Number.isInteger(sourceIndex) && sourceIndex !== targetIndex) {
            moveStep(sourceIndex, targetIndex)
        }
    }

    const addStep = () => {
        setForm((current) => ({
            ...current,
            flow: [...current.flow, { type: 'add', label: 'Custom step' }],
        }))
    }

    const removeStep = (index: number) => {
        setForm((current) => ({
            ...current,
            flow: current.flow.filter((_, stepIndex) => stepIndex !== index),
        }))
    }

    const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        setForm((current) => ({
            ...current,
            image: file,
            imagePreview: file ? URL.createObjectURL(file) : current.imagePreview,
        }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Commission Service' : 'Add Commission Service'}</DialogTitle>
                    <DialogDescription>
                        Set the public offer, quote rules, payment flow, refund policy, and required references.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                    <div>
                        <Label>Service image</Label>
                        <div className="mt-1 aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
                            {form.imagePreview ? (
                                <img src={form.imagePreview} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <Input className="mt-2" type="file" accept="image/*" onChange={handleImage} />
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <Label>Title</Label>
                                <Input
                                    value={form.title}
                                    onChange={(event) => setField('title', event.target.value)}
                                    placeholder="Character illustration"
                                />
                            </div>
                            <div>
                                <Label>Category</Label>
                                <select
                                    value={form.commission_category_id}
                                    onChange={(event) => setField('commission_category_id', event.target.value)}
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="">No category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={(event) => setField('description', event.target.value)}
                                className="min-h-24"
                                placeholder="Describe what wanderers can request."
                            />
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                            <NumberField label="Base credits" value={form.base_price_credits} onChange={(value) => setField('base_price_credits', value)} />
                            <NumberField label="Min quote credits" value={form.min_price_credits} onChange={(value) => setField('min_price_credits', value)} />
                            <NumberField label="Delivery days" value={form.delivery_days} onChange={(value) => setField('delivery_days', value)} />
                            <NumberField label="Slots" value={form.slots_available} onChange={(value) => setField('slots_available', value)} />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <Label>Status</Label>
                                <select
                                    value={form.status}
                                    onChange={(event) => setField('status', event.target.value as ServiceStatus)}
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="open">Open</option>
                                    <option value="waitlist">Waitlist</option>
                                    <option value="closed">Closed</option>
                                    <option value="paused">Paused</option>
                                </select>
                            </div>
                            <label className="mt-7 flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.is_published}
                                    onChange={(event) => setField('is_published', event.target.checked)}
                                    className="h-4 w-4"
                                />
                                Publish this service
                            </label>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <TextBlock label="Quote rules" value={form.quote_rules} onChange={(value) => setField('quote_rules', value)} />
                    <TextBlock label="Required references" value={form.required_references} onChange={(value) => setField('required_references', value)} />
                    <TextBlock label="Refund policy" value={form.refund_policy} onChange={(value) => setField('refund_policy', value)} />
                    <TextBlock label="Service terms" value={form.terms} onChange={(value) => setField('terms', value)} />
                </div>

                <div className="rounded-lg border p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold">Commission flow</h3>
                            <p className="text-xs text-muted-foreground">
                                Add payment, sketch, revision, custom, and delivery steps.
                            </p>
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={addStep}>
                            Add step
                        </Button>
                    </div>
                    <div className="grid gap-2">
                        {form.flow.map((step, index) => (
                            <div
                                key={`${step.label}-${index}`}
                                draggable
                                onDragStart={(event) => handleDragStart(event, index)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => handleDrop(event, index)}
                                className="grid cursor-grab gap-2 rounded-lg border p-2 active:cursor-grabbing md:grid-cols-[34px_110px_1fr_90px_90px_100px]"
                            >
                                <div className="flex h-9 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                                    {index + 1}
                                </div>
                                <select
                                    value={step.type}
                                    onChange={(event) => setFlowStep(index, { type: event.target.value as FlowType })}
                                    className="h-9 rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="pay">Pay</option>
                                    <option value="sketch">Sketch</option>
                                    <option value="revision">Revision</option>
                                    <option value="add">Add</option>
                                    <option value="done">Done</option>
                                </select>
                                <Input
                                    value={step.label}
                                    onChange={(event) => setFlowStep(index, { label: event.target.value })}
                                    placeholder="Step label"
                                />
                                <Input
                                    type="number"
                                    value={step.percent ?? 0}
                                    disabled={step.type !== 'pay'}
                                    onChange={(event) => setFlowStep(index, { percent: Number(event.target.value) })}
                                    placeholder="%"
                                />
                                <Input
                                    type="number"
                                    value={step.rounds ?? 0}
                                    disabled={!['sketch', 'revision'].includes(step.type)}
                                    onChange={(event) => setFlowStep(index, { rounds: Number(event.target.value) })}
                                    placeholder="Rounds"
                                />
                                <div className="flex gap-1">
                                    <Button type="button" size="sm" variant="destructive" onClick={() => removeStep(index)}>
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" disabled={saving} onClick={onSubmit}>
                        {saving ? 'Saving...' : editing ? 'Save Service' : 'Create Service'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
    return (
        <div>
            <Label>{label}</Label>
            <Input type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        </div>
    )
}

function TextBlock({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div>
            <Label>{label}</Label>
            <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-24" />
        </div>
    )
}

function buildServicePayload(form: ServiceForm): FormData {
    const payload = new FormData()
    payload.append('title', form.title.trim())
    payload.append('commission_category_id', form.commission_category_id)
    payload.append('description', form.description.trim())
    payload.append('base_price_credits', String(form.base_price_credits))
    payload.append('min_price_credits', String(form.min_price_credits))
    payload.append('delivery_days', String(form.delivery_days))
    payload.append('slots_available', String(form.slots_available))
    payload.append('status', form.status)
    payload.append('is_published', form.is_published ? '1' : '0')
    payload.append('terms', form.terms.trim())
    payload.append('quote_rules', form.quote_rules.trim())
    payload.append('refund_policy', form.refund_policy.trim())
    payload.append('required_references', form.required_references.trim())
    if (form.image) payload.append('image', form.image)
    form.flow.forEach((step, index) => {
        payload.append(`flow[${index}][type]`, step.type)
        payload.append(`flow[${index}][label]`, step.label)
        if (typeof step.percent === 'number') payload.append(`flow[${index}][percent]`, String(step.percent))
        if (typeof step.rounds === 'number') payload.append(`flow[${index}][rounds]`, String(step.rounds))
    })
    return payload
}

function CommissionAccordion({ title, children }: { title: string; children: ReactNode }) {
    return (
        <Collapsible defaultOpen className="rounded-lg border">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold">
                {title}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t px-3 py-3">{children}</CollapsibleContent>
        </Collapsible>
    )
}
