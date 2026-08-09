import { useState, type ChangeEvent } from 'react'
import { BriefcaseBusiness, ImageOff, PlusCircle, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import BoostModal from '@/features/boosts/components/BoostModal'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { CommissionProfile } from '@/types/art'
import type {
    CommissionCategory,
    CommissionService,
    ConfirmAction,
    InfoQuestion,
    PromoDiscount,
    RequestQuestion,
    ServiceForm,
    ServiceStatus,
    SetupOptions,
} from '@/features/commissions/types/studioCommission'
import {
    DEFAULT_LICENSE_QUESTION,
    DEFAULT_SETUP_OPTIONS,
    EMPTY_SERVICE_FORM,
} from '@/features/commissions/constants/serviceEditor'
import { ConfirmActionDialog } from '@/features/commissions/components/CommissionDashboard'
import { NumberField, RadioCard, SelectField, ToggleLine } from '@/features/commissions/components/ServiceFormFields'
import {
    DiscountsSection,
    InfoQuestionsSection,
    LicenseSection,
    RequestQuestionsSection,
} from '@/features/commissions/components/ServiceEditorSections'
import {
    buildServicePayload,
    normalizeClientFields,
    normalizeFlowTemplate,
    normalizePromoDiscounts,
    normalizeRequestQuestions,
} from '@/features/commissions/utils/serviceForm'
import { storageUrl } from '@/utils/storage'

// Commission service workspace ----
export function CommissionServicesSection({
    profile,
    services,
    categories,
    saving,
    deleting,
    onCreate,
    onUpdate,
    onDelete,
    onDeleteSelected,
}: {
    profile: CommissionProfile
    services: CommissionService[]
    categories: CommissionCategory[]
    saving: boolean
    deleting: boolean
    onCreate: (payload: FormData) => void
    onUpdate: (slug: string, payload: FormData) => void
    onDelete: (slug: string, title: string) => void
    onDeleteSelected: (targets: Array<{ slug: string; title: string }>) => void
}) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<CommissionService | null>(null)
    const [boostService, setBoostService] = useState<CommissionService | null>(null)
    const [form, setForm] = useState<ServiceForm>(EMPTY_SERVICE_FORM)
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
    const approved = profile.application_status === 'approved'
    const allSelected =
        services.length > 0 && services.every((service) => selectedServiceIds.includes(service.id))

    const openCreate = () => {
        setEditing(null)
        setForm({
            ...EMPTY_SERVICE_FORM,
            client_fields: normalizeClientFields(profile.client_fields),
            flow: normalizeFlowTemplate(profile.flow_template),
        })
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
            min_price_credits: service.base_price_credits,
            delivery_days: service.delivery_days ?? 7,
            slots_available: service.slots_available ?? 1,
            status: service.status,
            is_published: service.is_published,
            terms: service.terms ?? '',
            quote_rules: service.quote_rules ?? '',
            refund_policy: service.refund_policy ?? '',
            required_references: service.required_references ?? '',
            request_questions: service.request_questions ?? [],
            info_questions: service.info_questions ?? [],
            client_fields: normalizeClientFields(service.client_fields),
            promo_discounts: service.promo_discounts ?? [],
            setup_options: {
                ...DEFAULT_SETUP_OPTIONS,
                ...(service.setup_options ?? {}),
            },
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
        <section className="rounded-[24px] border border-border bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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
            {services.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2 text-sm">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            setSelectedServiceIds(
                                allSelected ? [] : services.map((service) => service.id)
                            )
                        }
                    >
                        {allSelected ? 'Unselect all' : 'Select all'}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedServiceIds([])}
                    >
                        Unselect
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={selectedServiceIds.length === 0 || deleting}
                        onClick={() => {
                            onDeleteSelected(
                                services
                                    .filter((service) => selectedServiceIds.includes(service.id))
                                    .map((service) => ({
                                        slug: service.slug,
                                        title: service.title,
                                    }))
                            )
                            setSelectedServiceIds([])
                        }}
                    >
                        Delete selected
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {selectedServiceIds.length} selected
                    </span>
                </div>
            )}

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
                                <label className="pt-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedServiceIds.includes(service.id)}
                                        onChange={(event) =>
                                            setSelectedServiceIds((current) =>
                                                event.target.checked
                                                    ? [...current, service.id]
                                                    : current.filter((id) => id !== service.id)
                                            )
                                        }
                                        className="h-4 w-4"
                                        aria-label={`Select ${service.title}`}
                                    />
                                </label>
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
                                        {service.delivery_days
                                            ? ` · ${service.delivery_days} days`
                                            : ''}
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
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEdit(service)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={deleting}
                                    onClick={() => onDelete(service.slug, service.title)}
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
                savedForms={normalizeRequestQuestions(profile.request_forms)}
                savedDiscounts={normalizePromoDiscounts(profile.discounts)}
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

function makeLocalId() {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function ServiceDialog({
    open,
    onOpenChange,
    form,
    setForm,
    categories,
    savedForms,
    savedDiscounts,
    editing,
    saving,
    onSubmit,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    form: ServiceForm
    setForm: React.Dispatch<React.SetStateAction<ServiceForm>>
    categories: CommissionCategory[]
    savedForms: RequestQuestion[]
    savedDiscounts: PromoDiscount[]
    editing: CommissionService | null
    saving: boolean
    onSubmit: () => void
}) {
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
    const setField = <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const addRequestQuestion = () => {
        setForm((current) => ({
            ...current,
            request_questions: [
                ...current.request_questions,
                {
                    id: makeLocalId(),
                    title: 'Extra information',
                    description: '',
                    type: 'textarea',
                    required: false,
                    options: [],
                },
            ],
        }))
    }

    const attachSavedQuestion = (question: RequestQuestion) => {
        setForm((current) => {
            if (current.request_questions.some((item) => item.id === question.id)) return current
            return {
                ...current,
                request_questions: [...current.request_questions, { ...question }],
            }
        })
    }

    const updateRequestQuestion = (index: number, patch: Partial<RequestQuestion>) => {
        setForm((current) => ({
            ...current,
            request_questions: current.request_questions.map((question, questionIndex) =>
                questionIndex === index ? { ...question, ...patch } : question
            ),
        }))
    }

    const removeRequestQuestion = (index: number) => {
        setForm((current) => ({
            ...current,
            request_questions: current.request_questions.filter(
                (_, questionIndex) => questionIndex !== index
            ),
        }))
    }

    const confirmRemoveRequestQuestion = (index: number) => {
        const title = form.request_questions[index]?.title || 'this question'
        setConfirmAction({
            title: 'Delete request question?',
            description: `Remove "${title}" from this service request form?`,
            confirmLabel: 'Delete question',
            destructive: true,
            onConfirm: () => removeRequestQuestion(index),
        })
    }

    const addInfoQuestion = () => {
        setForm((current) => ({
            ...current,
            info_questions: [
                ...current.info_questions,
                {
                    id: makeLocalId(),
                    question: 'Question clients often ask',
                    answer: 'Answer wanderers can read before requesting.',
                },
            ],
        }))
    }

    const updateInfoQuestion = (index: number, patch: Partial<InfoQuestion>) => {
        setForm((current) => ({
            ...current,
            info_questions: current.info_questions.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item
            ),
        }))
    }

    const removeInfoQuestion = (index: number) => {
        setForm((current) => ({
            ...current,
            info_questions: current.info_questions.filter((_, itemIndex) => itemIndex !== index),
        }))
    }

    const confirmRemoveInfoQuestion = (index: number) => {
        const title = form.info_questions[index]?.question || 'this info question'
        setConfirmAction({
            title: 'Delete info question?',
            description: `Remove "${title}" from this service FAQ?`,
            confirmLabel: 'Delete question',
            destructive: true,
            onConfirm: () => removeInfoQuestion(index),
        })
    }

    const addDiscount = () => {
        setForm((current) => ({
            ...current,
            promo_discounts: [
                ...current.promo_discounts,
                {
                    id: makeLocalId(),
                    label: 'Opening promo',
                    type: 'percent',
                    amount: 10,
                    starts_at: '',
                    ends_at: '',
                    active: true,
                },
            ],
        }))
    }

    const updateDiscount = (index: number, patch: Partial<PromoDiscount>) => {
        setForm((current) => ({
            ...current,
            promo_discounts: current.promo_discounts.map((discount, discountIndex) =>
                discountIndex === index ? { ...discount, ...patch } : discount
            ),
        }))
    }

    const removeDiscount = (index: number) => {
        setForm((current) => ({
            ...current,
            promo_discounts: current.promo_discounts.filter(
                (_, discountIndex) => discountIndex !== index
            ),
        }))
    }

    const confirmRemoveDiscount = (index: number) => {
        const title = form.promo_discounts[index]?.label || 'this promo'
        setConfirmAction({
            title: 'Delete promo?',
            description: `Remove "${title}" from this service?`,
            confirmLabel: 'Delete promo',
            destructive: true,
            onConfirm: () => removeDiscount(index),
        })
    }

    const updateSetup = (patch: Partial<SetupOptions>) => {
        setForm((current) => ({
            ...current,
            setup_options: { ...current.setup_options, ...patch },
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
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[min(92dvh,920px)] w-[min(96vw,1180px)] max-w-none flex-col overflow-hidden p-0 sm:max-w-none">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>
                        {editing ? 'Edit Commission Service' : 'Add Commission Service'}
                    </DialogTitle>
                    <DialogDescription>
                        Set the public offer, setup style, request questions, licenses, and attached
                        promos.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                        <div>
                            <Label>Service image</Label>
                            <div className="mt-1 aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
                                {form.imagePreview ? (
                                    <img
                                        src={form.imagePreview}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <ImageOff className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <Input
                                className="mt-2"
                                type="file"
                                accept="image/*"
                                onChange={handleImage}
                            />
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <Label>Name service</Label>
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
                                        onChange={(event) =>
                                            setField('commission_category_id', event.target.value)
                                        }
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
                                    onChange={(event) =>
                                        setField('description', event.target.value)
                                    }
                                    className="min-h-24"
                                    placeholder="Describe what wanderers can request."
                                />
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                <NumberField
                                    label="Base credits"
                                    value={form.base_price_credits}
                                    onChange={(value) => setField('base_price_credits', value)}
                                />
                                <NumberField
                                    label="Delivery days"
                                    value={form.delivery_days}
                                    onChange={(value) => setField('delivery_days', value)}
                                />
                                <NumberField
                                    label="Slots"
                                    value={form.slots_available}
                                    onChange={(value) => setField('slots_available', value)}
                                />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <Label>Start time</Label>
                                    <Input
                                        type="time"
                                        value={form.setup_options.start_time}
                                        onChange={(event) =>
                                            updateSetup({ start_time: event.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>End time</Label>
                                    <Input
                                        type="time"
                                        value={form.setup_options.end_time}
                                        onChange={(event) =>
                                            updateSetup({ end_time: event.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <Label>Status</Label>
                                    <select
                                        value={form.status}
                                        onChange={(event) =>
                                            setField('status', event.target.value as ServiceStatus)
                                        }
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
                                        onChange={(event) =>
                                            setField('is_published', event.target.checked)
                                        }
                                        className="h-4 w-4"
                                    />
                                    Publish this service
                                </label>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="setup" className="space-y-4">
                        <TabsList className="flex w-full flex-wrap justify-start">
                            <TabsTrigger value="setup">Setup</TabsTrigger>
                            <TabsTrigger value="questions">Questions</TabsTrigger>
                            <TabsTrigger value="licenses">Licenses</TabsTrigger>
                            <TabsTrigger value="promos">Promos</TabsTrigger>
                        </TabsList>

                        <TabsContent value="setup" className="space-y-4">
                            <div className="rounded-lg border p-3">
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold">Setup</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Choose how this service appears, communicates, and accepts
                                        requests.
                                    </p>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="md:col-span-3">
                                        <Label>Service type</Label>
                                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                                            <RadioCard
                                                checked={
                                                    form.setup_options.service_type === 'custom'
                                                }
                                                title="Custom"
                                                description="Made from scratch"
                                                onChange={() =>
                                                    updateSetup({ service_type: 'custom' })
                                                }
                                            />
                                            <RadioCard
                                                checked={
                                                    form.setup_options.service_type ===
                                                    'personalized'
                                                }
                                                title="Personalized"
                                                description="Made from template"
                                                onChange={() =>
                                                    updateSetup({ service_type: 'personalized' })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <SelectField
                                        label="Requesting process"
                                        value={form.setup_options.requesting_process}
                                        options={[
                                            ['custom_proposal', 'Custom proposal'],
                                            ['instant_order', 'Instant order'],
                                        ]}
                                        onChange={(value) =>
                                            updateSetup({
                                                requesting_process:
                                                    value as SetupOptions['requesting_process'],
                                            })
                                        }
                                    />
                                    <div className="md:col-span-3">
                                        <Label>Communication style</Label>
                                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                                            <RadioCard
                                                checked={
                                                    form.setup_options.communication_style ===
                                                    'open'
                                                }
                                                title="Open communication"
                                                description="WIP updates + revisions"
                                                onChange={() =>
                                                    updateSetup({ communication_style: 'open' })
                                                }
                                            />
                                            <RadioCard
                                                checked={
                                                    form.setup_options.communication_style ===
                                                    'surprise'
                                                }
                                                title="Simple communication"
                                                description="No WIP updates + mistakes fixes only"
                                                onChange={() =>
                                                    updateSetup({ communication_style: 'surprise' })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 grid gap-2 md:grid-cols-3">
                                    <ToggleLine
                                        label="Notify followers on status change"
                                        checked={
                                            form.setup_options.notify_followers_on_status_change
                                        }
                                        onChange={(checked) =>
                                            updateSetup({
                                                notify_followers_on_status_change: checked,
                                            })
                                        }
                                    />
                                    <ToggleLine
                                        label="Mark as sensitive content"
                                        checked={form.setup_options.sensitive}
                                        onChange={(checked) => updateSetup({ sensitive: checked })}
                                    />
                                    <ToggleLine
                                        label="Display service stats"
                                        checked={form.setup_options.display_service_stats}
                                        onChange={(checked) =>
                                            updateSetup({ display_service_stats: checked })
                                        }
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="questions" className="space-y-4">
                            {savedForms.length > 0 && (
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    <div className="mb-2">
                                        <h3 className="text-sm font-semibold">
                                            Saved form questions
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Attach reusable questions from the Forms tab to this
                                            service.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {savedForms.map((question) => {
                                            const attached = form.request_questions.some(
                                                (item) => item.id === question.id
                                            )

                                            return (
                                                <Button
                                                    key={question.id}
                                                    type="button"
                                                    size="sm"
                                                    variant={attached ? 'default' : 'outline'}
                                                    disabled={attached}
                                                    onClick={() => attachSavedQuestion(question)}
                                                >
                                                    {attached ? 'Attached' : 'Attach'}{' '}
                                                    {question.title}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            <RequestQuestionsSection
                                questions={form.request_questions}
                                onAdd={addRequestQuestion}
                                onUpdate={updateRequestQuestion}
                                onRemove={confirmRemoveRequestQuestion}
                            />

                            <InfoQuestionsSection
                                items={form.info_questions}
                                onAdd={addInfoQuestion}
                                onUpdate={updateInfoQuestion}
                                onRemove={confirmRemoveInfoQuestion}
                            />
                        </TabsContent>

                        <TabsContent value="promos" className="space-y-4">
                            {savedDiscounts.length > 0 && (
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    <div className="mb-2">
                                        <h3 className="text-sm font-semibold">
                                            Saved discount promos
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Attach reusable promos from the Promotions tab to this
                                            service.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {savedDiscounts.map((discount) => {
                                            const attached = form.promo_discounts.some(
                                                (item) => item.id === discount.id
                                            )

                                            return (
                                                <Button
                                                    key={discount.id}
                                                    type="button"
                                                    size="sm"
                                                    variant={attached ? 'default' : 'outline'}
                                                    disabled={attached}
                                                    onClick={() =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            promo_discounts: [
                                                                ...current.promo_discounts,
                                                                {
                                                                    ...discount,
                                                                    starts_at:
                                                                        discount.starts_at ?? '',
                                                                    ends_at:
                                                                        discount.ends_at ?? '',
                                                                },
                                                            ],
                                                        }))
                                                    }
                                                >
                                                    {attached ? 'Attached' : 'Attach'}{' '}
                                                    {discount.label}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            <DiscountsSection
                                discounts={form.promo_discounts}
                                onAdd={addDiscount}
                                onUpdate={updateDiscount}
                                onRemove={confirmRemoveDiscount}
                            />
                        </TabsContent>

                        <TabsContent value="licenses" className="space-y-4">
                            <LicenseSection
                                questions={form.request_questions}
                                onUpdate={updateRequestQuestion}
                                onAdd={() =>
                                    setForm((current) => ({
                                        ...current,
                                        request_questions: [
                                            ...current.request_questions.filter(
                                                (question) =>
                                                    question.id !== DEFAULT_LICENSE_QUESTION.id
                                            ),
                                            DEFAULT_LICENSE_QUESTION,
                                        ],
                                    }))
                                }
                            />
                        </TabsContent>

                    </Tabs>
                </div>

                <DialogFooter className="border-t bg-background p-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" disabled={saving} onClick={onSubmit}>
                        {saving ? 'Saving...' : editing ? 'Save Service' : 'Create Service'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <ConfirmActionDialog
            action={confirmAction}
            busy={false}
            onOpenChange={(dialogOpen) => {
                if (!dialogOpen) setConfirmAction(null)
            }}
        />
        </>
    )
}



