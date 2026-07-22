import { useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
    BriefcaseBusiness,
    CheckCircle2,
    ChevronDown,
    Clock3,
    ClipboardList,
    Eye,
    FileQuestion,
    GripVertical,
    Heart,
    ImageOff,
    MessageSquareText,
    Users,
    PlusCircle,
    Settings,
    ShieldAlert,
    Sparkles,
    Star,
    Trash2,
    Workflow,
} from 'lucide-react'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import type { CommissionProfile } from '@/types/art'
import BoostModal from '@/features/boosts/components/BoostModal'
import ThemedLogo from '@/components/layout/ThemedLogo'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    request_questions: RequestQuestion[]
    info_questions: InfoQuestion[]
    client_fields: ClientFields
    promo_discounts: PromoDiscount[]
    setup_options: SetupOptions
    is_published: boolean
    boosted_until?: string | null
    commission_category_id: string | null
    category: CommissionCategory | null
}

interface RequestQuestion {
    id: string
    title: string
    description: string
    type: 'textarea' | 'short_text' | 'multiple_choice' | 'date' | 'checkbox'
    required: boolean
    options: string[]
}

interface InfoQuestion {
    id: string
    question: string
    answer: string
}

interface ClientFields {
    name: { collect: boolean; required: boolean }
    nickname: { collect: boolean; required: boolean }
    email: { collect: boolean; required: boolean }
    discord: { collect: boolean; required: boolean }
    twitter: { collect: boolean; required: boolean }
    instagram: { collect: boolean; required: boolean }
    facebook: { collect: boolean; required: boolean }
    tiktok: { collect: boolean; required: boolean }
}

interface PromoDiscount {
    id: string
    label: string
    type: 'percent' | 'fixed'
    amount: number
    starts_at: string
    ends_at: string
    active: boolean
}

interface SetupOptions {
    visibility: 'discoverable' | 'hidden'
    service_type: 'custom' | 'personalized'
    communication_style: 'open' | 'surprise'
    requesting_process: 'custom_proposal' | 'instant_order'
    notify_followers_on_status_change: boolean
    sensitive: boolean
    display_service_stats: boolean
    estimated_start: string
    start_time: string
    end_time: string
    guaranteed_delivery_days: number
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
    status:
        | 'requested'
        | 'awaiting_payment'
        | 'in_progress'
        | 'delivered'
        | 'completed'
        | 'cancelled'
        | 'disputed'
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
        base_price_credits?: number
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
    request_questions: RequestQuestion[]
    info_questions: InfoQuestion[]
    client_fields: ClientFields
    promo_discounts: PromoDiscount[]
    setup_options: SetupOptions
    flow: FlowStep[]
}

const DEFAULT_CLIENT_FIELDS: ClientFields = {
    name: { collect: true, required: false },
    nickname: { collect: true, required: false },
    email: { collect: false, required: false },
    discord: { collect: false, required: false },
    twitter: { collect: false, required: false },
    instagram: { collect: false, required: false },
    facebook: { collect: false, required: false },
    tiktok: { collect: false, required: false },
}

const DEFAULT_SETUP_OPTIONS: SetupOptions = {
    visibility: 'discoverable',
    service_type: 'custom',
    communication_style: 'open',
    requesting_process: 'custom_proposal',
    notify_followers_on_status_change: false,
    sensitive: false,
    display_service_stats: true,
    estimated_start: 'this_month',
    start_time: '',
    end_time: '',
    guaranteed_delivery_days: 14,
}

const DEFAULT_LICENSE_QUESTION: RequestQuestion = {
    id: 'license-use',
    title: 'How will you be using this commission?',
    description: 'Choose the license you need.',
    type: 'multiple_choice',
    required: false,
    options: defaultLicenseOptions(),
}

function defaultLicenseOptions() {
    return [
        'Personal - individual, non-commercial and non-monetized use only',
        'Commercial: Content - for content creators or businesses distributing commercial or monetized digital content',
        'Commercial: Merchandising - for creating, promoting, and reselling digital or physical products with the asset',
    ]
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
    refund_policy:
        '100% refund if no sketch/work has been sent. 50% refund once the first sketch/work has started.',
    required_references: '',
    request_questions: [DEFAULT_LICENSE_QUESTION],
    info_questions: [],
    client_fields: DEFAULT_CLIENT_FIELDS,
    promo_discounts: [],
    setup_options: DEFAULT_SETUP_OPTIONS,
    flow: [
        { type: 'pay', label: 'Pay 50%', percent: 50 },
        { type: 'sketch', label: 'Sketch', rounds: 2 },
        { type: 'revision', label: 'Revision', rounds: 1 },
        { type: 'pay', label: 'Pay 50%', percent: 50 },
        { type: 'done', label: 'Delivery and receipt' },
    ],
}

const COMMISSION_NAV_ITEMS = [
    { value: 'workflow', label: 'Commissions', icon: Sparkles },
    { value: 'services', label: 'Services', icon: BriefcaseBusiness },
    { value: 'forms', label: 'Forms', icon: ClipboardList },
    { value: 'requests', label: 'Orders', icon: Workflow },
    { value: 'policies', label: 'Policies', icon: ShieldAlert },
    { value: 'discounts', label: 'Promotions', icon: Star },
    { value: 'faq', label: 'FAQ', icon: FileQuestion },
    { value: 'ratings', label: 'Ratings', icon: CheckCircle2 },
    { value: 'settings', label: 'Settings', icon: Settings },
]

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
            toast.error(
                error?.response?.data?.message ?? 'Could not submit commission application.'
            ),
    })

    const updateSettings = useMutation({
        mutationFn: (payload: {
            commissions_enabled?: boolean
            commission_status?: 'open' | 'closed'
            terms?: string
            policies?: Record<string, string>
            request_forms?: RequestQuestion[]
            faqs?: InfoQuestion[]
            discounts?: PromoDiscount[]
            client_fields?: ClientFields
            flow_template?: FlowStep[]
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

    const advanceStage = useMutation({
        mutationFn: ({ id, step_index, note }: { id: string; step_index: number; note?: string }) =>
            studioApi.advanceCommissionStage(id, { step_index, note }),
        onSuccess: () => {
            toast.success('Commission stage updated.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not update stage.'),
    })

    const appealRating = useMutation({
        mutationFn: ({ id, appeal_reason }: { id: string; appeal_reason: string }) =>
            studioApi.appealCommissionRating(id, appeal_reason).then((res) => res.data),
        onSuccess: () => {
            toast.success('Rating appeal sent to admin.')
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not appeal rating.'),
    })

    if (isLoading || !profile) {
        return (
            <div className="rounded-3xl border bg-muted/30 p-8 text-sm text-muted-foreground">
                Loading commission settings...
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-[1500px] pb-16">
            <header className="mb-5 px-1">
                <h1 className="text-2xl font-black uppercase tracking-[0.03em] sm:text-3xl">
                    Commissions
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Apply, create commission services, and manage your commission availability.
                </p>
            </header>

            <CommissionDashboardHero
                profile={profile}
                services={services}
                orders={orders}
                widgets={widgets}
            />

            {profile.application_status !== 'approved' && (
                <div className="mt-5">
                    <CommissionApplicationSection
                        profile={profile}
                        busy={applyCommission.isPending}
                        onApply={(reason) => applyCommission.mutate(reason)}
                    />
                </div>
            )}

            <Tabs
                defaultValue="workflow"
                className="mt-5 grid items-start gap-5 lg:grid-cols-[210px_minmax(0,1fr)]"
            >
                <TabsList className="flex h-auto w-full flex-row items-stretch justify-start gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/70 bg-background/80 p-2 shadow-sm backdrop-blur lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
                    {COMMISSION_NAV_ITEMS.map(({ value, label, icon: Icon }) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            className="group h-11 shrink-0 justify-start gap-3 rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-foreground shadow-none transition-all duration-200 hover:bg-muted/70 data-[state=active]:border-sky-200 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-[0_8px_20px_rgba(14,165,233,0.28)] lg:w-full"
                        >
                            <Icon className="h-4 w-4 shrink-0 text-orange-500 transition-colors group-data-[state=active]:text-white" />
                            <span>{label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="min-w-0">
                    <TabsContent value="workflow" className="mt-0">
                        <CommissionWorkflowSection
                            orders={orders}
                            busy={advanceStage.isPending || updateOrder.isPending}
                            onMove={(id, status) => updateOrder.mutate({ id, status })}
                        />
                    </TabsContent>

                    <TabsContent value="services" className="mt-0">
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
                    </TabsContent>

                    <TabsContent value="forms" className="mt-0">
                        <CommissionFormsWorkspace
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(request_forms) => updateSettings.mutate({ request_forms })}
                        />
                    </TabsContent>

                    <TabsContent value="requests" className="mt-0">
                        <CommissionRequestsSection orders={orders} />
                    </TabsContent>

                    <TabsContent value="policies" className="mt-0">
                        <CommissionPoliciesSection
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(policies) => updateSettings.mutate({ policies })}
                        />
                    </TabsContent>

                    <TabsContent value="discounts" className="mt-0">
                        <CommissionDiscountWorkspace
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(discounts) => updateSettings.mutate({ discounts })}
                        />
                    </TabsContent>

                    <TabsContent value="faq" className="mt-0">
                        <CommissionFaqWorkspace
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(faqs) => updateSettings.mutate({ faqs })}
                        />
                    </TabsContent>

                    <TabsContent value="ratings" className="mt-0">
                        <CommissionRatingsSectionV2
                            ratings={ratings}
                            busy={appealRating.isPending}
                            onAppeal={(id, appeal_reason) =>
                                appealRating.mutate({ id, appeal_reason })
                            }
                        />
                    </TabsContent>

                    <TabsContent value="settings" className="mt-0">
                        <CommissionSettingsSection
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(payload) => updateSettings.mutate(payload)}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function CommissionDashboardHero({
    profile,
    services,
    orders,
    widgets,
}: {
    profile: CommissionProfile
    services: CommissionService[]
    orders: CommissionOrder[]
    widgets?: CommissionWidgetsData
}) {
    const activeServices = services.filter(
        (service) => service.status === 'open' && service.is_published
    ).length
    const totalOrders = widgets?.total_orders ?? orders.length
    const completedOrders =
        widgets?.completed_orders ?? orders.filter((order) => order.status === 'completed').length
    const activeOrders =
        widgets?.active_orders ??
        orders.filter((order) =>
            ['awaiting_payment', 'in_progress', 'delivered'].includes(order.status)
        ).length
    const chartPoints = buildCommissionChartPoints(orders)
    const featuredService = services.find((service) => service.image_path) ?? services[0] ?? null
    const featuredImage = featuredService?.image_path ?? null
    const averageRating = profile.ratings_count ? profile.average_rating.toFixed(1) : 'New'

    return (
        <div className="space-y-4">
            <section className="overflow-hidden rounded-[28px] border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-background to-orange-50/40 p-2.5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-3">
                <div className="grid gap-3 xl:grid-cols-[190px_minmax(0,1fr)]">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="relative min-h-56 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm">
                            {featuredImage ? (
                                <img
                                    src={storageUrl(featuredImage)!}
                                    alt={featuredService?.title ?? 'Featured commission service'}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 via-rose-50 to-sky-100 text-center">
                                    <ThemedLogo width={96} height={96} className="object-contain" />
                                    <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                                        Events
                                    </p>
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-3 pt-12 text-white">
                                <p className="line-clamp-1 text-sm font-bold">
                                    {featuredService?.title ?? 'Open for commissions'}
                                </p>
                                <p className="mt-0.5 text-[10px] text-white/80">
                                    {activeServices} active service
                                    {activeServices === 1 ? '' : 's'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 bg-background px-4 py-3 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                        Commission status
                                    </p>
                                    <p className="mt-1 text-sm font-bold capitalize">
                                        {profile.commission_status ?? 'closed'}
                                    </p>
                                </div>
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                        profile.commission_status === 'open'
                                            ? 'bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]'
                                            : 'bg-slate-300 shadow-[0_0_0_5px_rgba(148,163,184,0.12)]'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-background p-4 shadow-sm sm:p-5">
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">
                                    Activity
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    Last seven days · commission requests
                                </p>
                            </div>
                            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                {totalOrders} total
                            </span>
                        </div>

                        <MiniAreaChart points={chartPoints} />

                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
                            <DashboardStat
                                icon={<BriefcaseBusiness className="h-4 w-4" />}
                                label="Services"
                                value={services.length}
                            />
                            <DashboardStat
                                icon={<Eye className="h-4 w-4" />}
                                label="Orders"
                                value={totalOrders}
                            />
                            <DashboardStat
                                icon={<Heart className="h-4 w-4 fill-rose-500 text-rose-500" />}
                                label="Active"
                                value={activeOrders}
                            />
                            <DashboardStat
                                icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                                label="Rate"
                                value={averageRating}
                            />
                            <DashboardStat
                                icon={<MessageSquareText className="h-4 w-4 text-orange-500" />}
                                label="Completed"
                                value={completedOrders}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <section className="rounded-[24px] border border-slate-200/80 bg-muted/35 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Customers & orders
                        </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
                        <MiniMetric label="Total orders" value={totalOrders} />
                        <MiniMetric label="Average rating" value={averageRating} />
                        <MiniMetric label="Completed orders" value={completedOrders} />
                        <MiniMetric label="Active orders" value={activeOrders} />
                    </div>
                </section>

                <section className="relative min-h-44 overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-r from-rose-100 via-orange-50 to-sky-100 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                    {featuredImage ? (
                        <img
                            src={storageUrl(featuredImage)!}
                            alt="Commission banner"
                            className="absolute inset-0 h-full w-full object-cover object-center"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ThemedLogo width={126} height={126} className="object-contain" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-transparent" />
                </section>
            </div>
        </div>
    )
}

function MiniAreaChart({ points }: { points: number[] }) {
    const width = 720
    const height = 190
    const baseline = 144
    const chartTop = 30
    const max = Math.max(...points, 1)
    const left = 18
    const right = width - 18
    const step = (right - left) / Math.max(points.length - 1, 1)
    const coords = points.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point / max) * (baseline - chartTop),
    }))
    const linePath = createSmoothChartPath(coords)
    const first = coords[0]
    const last = coords[coords.length - 1]
    const areaPath =
        first && last ? `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z` : ''
    const labels = points.map((_, index) => {
        const date = new Date()
        date.setDate(date.getDate() - (points.length - 1 - index))
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        })
    })

    return (
        <div className="h-52 overflow-hidden rounded-2xl bg-gradient-to-b from-background to-sky-50/65 sm:h-56">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-full w-full"
                role="img"
                aria-label="Commission requests during the last seven days"
            >
                {[0, 1, 2, 3].map((lineIndex) => {
                    const y = 34 + lineIndex * 32
                    return (
                        <line
                            key={lineIndex}
                            x1={left}
                            x2={right}
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            strokeDasharray="3 5"
                            className="text-slate-200/90"
                        />
                    )
                })}

                <defs>
                    <linearGradient id="commission-chart-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.68" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
                    </linearGradient>
                </defs>

                <path d={areaPath} fill="url(#commission-chart-fill)" />
                <path
                    d={linePath}
                    fill="none"
                    stroke="#7dd3fc"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {coords.map((point, index) => (
                    <g key={`${point.x}-${index}`}>
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r="3.5"
                            fill="#ffffff"
                            stroke="#38bdf8"
                            strokeWidth="2"
                        />
                        <text
                            x={point.x}
                            y={174}
                            textAnchor="middle"
                            className="fill-slate-400 text-[8px]"
                        >
                            {labels[index]}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    )
}

function createSmoothChartPath(points: Array<{ x: number; y: number }>) {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

    return points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`

        const previous = points[index - 1]
        const controlX = (previous.x + point.x) / 2

        return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
    }, '')
}

function buildCommissionChartPoints(orders: CommissionOrder[]) {
    const days = Array.from({ length: 7 }, (_, index) => {
        const day = new Date()
        day.setHours(0, 0, 0, 0)
        day.setDate(day.getDate() - (6 - index))
        return day
    })

    const points = days.map((day) => {
        const next = new Date(day)
        next.setDate(day.getDate() + 1)
        return orders.filter((order) => {
            const created = new Date(order.created_at)
            return created >= day && created < next
        }).length
    })

    return points.some(Boolean) ? points : [0, 1, 2, 3, 5, 3, 1]
}

function DashboardStat({
    icon,
    label,
    value,
}: {
    icon: ReactNode
    label: string
    value: number | string
}) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-background px-3 py-3 shadow-[0_5px_18px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                <span className="text-foreground">{icon}</span>
                <span>{label}</span>
            </div>
            <div className="mt-1 text-center text-lg font-black tracking-tight">
                {typeof value === 'number' ? formatCompactMetric(value) : value}
            </div>
        </div>
    )
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
    return (
        <div>
            <div className="text-lg font-black tracking-tight sm:text-xl">
                {typeof value === 'number' ? formatCompactMetric(value) : value}
            </div>
            <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{label}</div>
        </div>
    )
}

function formatCompactMetric(value: number) {
    return Intl.NumberFormat(undefined, {
        notation: value >= 1000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
    }).format(value)
}

function normalizeClientFields(value?: CommissionProfile['client_fields']): ClientFields {
    return {
        ...DEFAULT_CLIENT_FIELDS,
        ...(value ?? {}),
        name: { ...DEFAULT_CLIENT_FIELDS.name, ...(value?.name ?? {}) },
        nickname: { ...DEFAULT_CLIENT_FIELDS.nickname, ...(value?.nickname ?? {}) },
        email: { ...DEFAULT_CLIENT_FIELDS.email, ...(value?.email ?? {}) },
        discord: { ...DEFAULT_CLIENT_FIELDS.discord, ...(value?.discord ?? {}) },
        twitter: { ...DEFAULT_CLIENT_FIELDS.twitter, ...(value?.twitter ?? {}) },
        instagram: {
            ...DEFAULT_CLIENT_FIELDS.instagram,
            ...(value?.instagram ?? {}),
        },
        facebook: { ...DEFAULT_CLIENT_FIELDS.facebook, ...(value?.facebook ?? {}) },
        tiktok: { ...DEFAULT_CLIENT_FIELDS.tiktok, ...(value?.tiktok ?? {}) },
    }
}

function normalizeFlowTemplate(value?: CommissionProfile['flow_template']): FlowStep[] {
    const source = Array.isArray(value) && value.length > 0 ? value : EMPTY_SERVICE_FORM.flow
    return source.map((step) => ({
        type: normalizeFlowType(step.type),
        label: step.label || 'Commission step',
        percent: typeof step.percent === 'number' ? step.percent : undefined,
        rounds: typeof step.rounds === 'number' ? step.rounds : undefined,
    }))
}

function normalizeFlowType(type: string): FlowType {
    return ['pay', 'sketch', 'revision', 'add', 'done'].includes(type) ? (type as FlowType) : 'add'
}

function normalizeRequestQuestions(value?: CommissionProfile['request_forms']): RequestQuestion[] {
    const source = Array.isArray(value) && value.length > 0 ? value : [DEFAULT_LICENSE_QUESTION]
    return source.map((question) => ({
        id: question.id || makeLocalId(),
        title: question.title || 'Question',
        description: question.description ?? '',
        type: question.type ?? 'textarea',
        required: Boolean(question.required),
        options: Array.isArray(question.options) ? question.options : [],
    }))
}

function CommissionPoliciesSection({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (policies: Record<string, string>) => void
}) {
    const [policies, setPolicies] = useState({
        terms: profile.policies?.terms ?? profile.terms ?? '',
        refund_policy:
            profile.policies?.refund_policy ??
            '100% refund if no sketch/work has been sent. 50% refund once the first sketch/work has started.',
        required_references: profile.policies?.required_references ?? '',
    })

    const setPolicy = (key: keyof typeof policies, value: string) =>
        setPolicies((current) => ({ ...current, [key]: value }))

    return (
        <section className="rounded-[24px] border border-slate-200/80 bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4">
                <h2 className="text-base font-semibold">Policies</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Terms, refund policy, and required references. Use headings, bold markers, and
                    bullets to keep it readable.
                </p>
            </div>
            <Tabs defaultValue="terms" className="space-y-4">
                <TabsList className="flex h-auto w-full flex-wrap justify-start">
                    <TabsTrigger value="terms">Terms of Service</TabsTrigger>
                    <TabsTrigger value="refund">Refund policy</TabsTrigger>
                    <TabsTrigger value="references">Required references</TabsTrigger>
                </TabsList>
                <TabsContent value="terms" className="mt-0">
                    <RichTextBlock
                        label="Terms of Service"
                        value={policies.terms}
                        onChange={(value) => setPolicy('terms', value)}
                        onFormat={(prefix, suffix = '') =>
                            setPolicy(
                                'terms',
                                policies.terms ? `${prefix}${policies.terms}${suffix}` : prefix
                            )
                        }
                    />
                </TabsContent>
                <TabsContent value="refund" className="mt-0">
                    <RichTextBlock
                        label="Refund policy"
                        value={policies.refund_policy}
                        onChange={(value) => setPolicy('refund_policy', value)}
                        onFormat={(prefix, suffix = '') =>
                            setPolicy(
                                'refund_policy',
                                policies.refund_policy
                                    ? `${prefix}${policies.refund_policy}${suffix}`
                                    : prefix
                            )
                        }
                    />
                </TabsContent>
                <TabsContent value="references" className="mt-0">
                    <RichTextBlock
                        label="Required references"
                        value={policies.required_references}
                        onChange={(value) => setPolicy('required_references', value)}
                        onFormat={(prefix, suffix = '') =>
                            setPolicy(
                                'required_references',
                                policies.required_references
                                    ? `${prefix}${policies.required_references}${suffix}`
                                    : prefix
                            )
                        }
                    />
                </TabsContent>
            </Tabs>
            <Button className="mt-4" disabled={busy} onClick={() => onSave(policies)}>
                {busy ? 'Saving...' : 'Save policies'}
            </Button>
        </section>
    )
}

function CommissionFormsWorkspace({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (forms: RequestQuestion[]) => void
}) {
    const [forms, setForms] = useState<RequestQuestion[]>(
        normalizeRequestQuestions(profile.request_forms)
    )
    const [adding, setAdding] = useState(false)
    const [draft, setDraft] = useState<RequestQuestion>({
        id: makeLocalId(),
        title: '',
        description: '',
        type: 'textarea',
        required: false,
        options: [],
    })

    const openAdd = () => {
        setDraft({
            id: makeLocalId(),
            title: '',
            description: '',
            type: 'textarea',
            required: false,
            options: [],
        })
        setAdding(true)
    }

    const addDraft = () => {
        if (!draft.title.trim()) {
            toast.error('Question title is required.')
            return
        }
        setForms((current) => [...current, draft])
        setAdding(false)
    }

    return (
        <section className="rounded-[24px] border border-slate-200/80 bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <RequestQuestionsSection
                questions={forms}
                onAdd={openAdd}
                onUpdate={(index, patch) =>
                    setForms((current) =>
                        current.map((question, questionIndex) =>
                            questionIndex === index ? { ...question, ...patch } : question
                        )
                    )
                }
                onRemove={(index) =>
                    setForms((current) =>
                        current.filter((_, questionIndex) => questionIndex !== index)
                    )
                }
            />
            <Button className="mt-4" disabled={busy} onClick={() => onSave(forms)}>
                {busy ? 'Saving...' : 'Save forms'}
            </Button>
            <Dialog open={adding} onOpenChange={setAdding}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add question</DialogTitle>
                        <DialogDescription>
                            Save a reusable question that can be attached to a commission service.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div>
                            <Label>Question</Label>
                            <Input
                                value={draft.title}
                                onChange={(event) =>
                                    setDraft((current) => ({ ...current, title: event.target.value }))
                                }
                                placeholder="How will you use this commission?"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={draft.description}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                className="min-h-20"
                                placeholder="Optional helper text."
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <SelectField
                                label="Answer type"
                                value={draft.type}
                                options={[
                                    ['textarea', 'Textarea'],
                                    ['short_text', 'Short text'],
                                    ['multiple_choice', 'Multiple choice'],
                                    ['date', 'Date'],
                                    ['checkbox', 'Checkbox'],
                                ]}
                                onChange={(value) =>
                                    setDraft((current) => ({
                                        ...current,
                                        type: value as RequestQuestion['type'],
                                    }))
                                }
                            />
                            <label className="mt-6 flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={draft.required}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            required: event.target.checked,
                                        }))
                                    }
                                />
                                Required
                            </label>
                        </div>
                        {draft.type === 'multiple_choice' && (
                            <div>
                                <Label>Options</Label>
                                <Textarea
                                    value={draft.options.join('\n')}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            options: event.target.value
                                                .split(/\r?\n/)
                                                .map((option) => option.trim())
                                                .filter(Boolean),
                                        }))
                                    }
                                    className="min-h-24"
                                    placeholder={'One option per line'}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={addDraft}>
                            Add question
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

function CommissionFaqWorkspace({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (faqs: InfoQuestion[]) => void
}) {
    const [faqs, setFaqs] = useState<InfoQuestion[]>(profile.faqs ?? [])

    return (
        <section className="rounded-[24px] border border-slate-200/80 bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <InfoQuestionsSection
                items={faqs}
                onAdd={() =>
                    setFaqs((current) => [
                        ...current,
                        {
                            id: makeLocalId(),
                            question: 'Question clients often ask',
                            answer: 'Answer wanderers can read before requesting.',
                        },
                    ])
                }
                onUpdate={(index, patch) =>
                    setFaqs((current) =>
                        current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, ...patch } : item
                        )
                    )
                }
                onRemove={(index) =>
                    setFaqs((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
            />
            <Button className="mt-4" disabled={busy} onClick={() => onSave(faqs)}>
                {busy ? 'Saving...' : 'Save FAQ'}
            </Button>
        </section>
    )
}

function CommissionDiscountWorkspace({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (discounts: PromoDiscount[]) => void
}) {
    const [discounts, setDiscounts] = useState<PromoDiscount[]>(
        (profile.discounts ?? []).map((discount) => ({
            ...discount,
            starts_at: discount.starts_at ?? '',
            ends_at: discount.ends_at ?? '',
        }))
    )
    const [adding, setAdding] = useState(false)
    const [draft, setDraft] = useState<PromoDiscount>({
        id: makeLocalId(),
        label: 'Opening promo',
        type: 'percent',
        amount: 10,
        starts_at: '',
        ends_at: '',
        active: true,
    })

    const openAdd = () => {
        setDraft({
            id: makeLocalId(),
            label: 'Opening promo',
            type: 'percent',
            amount: 10,
            starts_at: '',
            ends_at: '',
            active: true,
        })
        setAdding(true)
    }

    const addDraft = () => {
        if (!draft.label.trim()) {
            toast.error('Discount name is required.')
            return
        }
        setDiscounts((current) => [...current, draft])
        setAdding(false)
    }

    return (
        <section className="rounded-[24px] border border-slate-200/80 bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <DiscountsSection
                discounts={discounts}
                onAdd={openAdd}
                onUpdate={(index, patch) =>
                    setDiscounts((current) =>
                        current.map((discount, discountIndex) =>
                            discountIndex === index ? { ...discount, ...patch } : discount
                        )
                    )
                }
                onRemove={(index) =>
                    setDiscounts((current) =>
                        current.filter((_, discountIndex) => discountIndex !== index)
                    )
                }
            />
            <Button className="mt-4" disabled={busy} onClick={() => onSave(discounts)}>
                {busy ? 'Saving...' : 'Save discounts'}
            </Button>
            <Dialog open={adding} onOpenChange={setAdding}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add discount</DialogTitle>
                        <DialogDescription>
                            Create a promo the artist can attach to commission services.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div>
                            <Label>Discount name</Label>
                            <Input
                                value={draft.label}
                                onChange={(event) =>
                                    setDraft((current) => ({ ...current, label: event.target.value }))
                                }
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <SelectField
                                label="Type"
                                value={draft.type}
                                options={[
                                    ['percent', 'Percent'],
                                    ['fixed', 'Fixed credits'],
                                ]}
                                onChange={(value) =>
                                    setDraft((current) => ({
                                        ...current,
                                        type: value as PromoDiscount['type'],
                                    }))
                                }
                            />
                            <div>
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    value={draft.amount}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            amount: Number(event.target.value),
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Promo start</Label>
                                <Input
                                    type="date"
                                    value={draft.starts_at}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            starts_at: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>Promo end</Label>
                                <Input
                                    type="date"
                                    value={draft.ends_at}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            ends_at: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={draft.active}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        active: event.target.checked,
                                    }))
                                }
                            />
                            Active
                        </label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={addDraft}>
                            Add discount
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

function CommissionWorkflowSection({
    orders,
    busy,
    onMove,
}: {
    orders: CommissionOrder[]
    busy: boolean
    onMove: (id: string, status: 'in_progress' | 'delivered' | 'cancelled' | 'disputed') => void
}) {
    const columns = [
        {
            key: 'todo',
            title: 'TODO',
            statuses: ['requested', 'awaiting_payment'],
        },
        {
            key: 'in_progress',
            title: 'IN-PROGRESS',
            statuses: ['in_progress', 'disputed'],
        },
        {
            key: 'done',
            title: 'DONE',
            statuses: ['delivered', 'completed', 'cancelled'],
        },
    ]

    const statusForColumn = (key: string): 'in_progress' | 'delivered' | null => {
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
                        Drag active orders to move them through your production board.
                    </p>
                </div>
                <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                    {orders.length} order{orders.length === 1 ? '' : 's'}
                </span>
            </div>

            <div className="overflow-x-auto pb-1">
                <div className="grid min-w-[790px] grid-cols-3 gap-3">
                    {columns.map((column) => {
                        const columnOrders = orders.filter((order) =>
                            column.statuses.includes(order.status)
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
                                    if (id) onMove(id, nextStatus)
                                }}
                                className="min-h-[420px] rounded-2xl bg-white/15 p-1"
                            >
                                <div className="mb-3 flex items-center justify-between px-1">
                                    <h3 className="text-[11px] font-black tracking-[0.08em] text-slate-800">
                                        {column.title}
                                    </h3>
                                    <span className="rounded-full bg-white/75 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                        {columnOrders.length}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {columnOrders.length === 0 ? (
                                        <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white/35 px-4 text-center text-xs text-slate-400">
                                            No commissions in this column.
                                        </div>
                                    ) : (
                                        columnOrders.map((order) => {
                                            const canDrag =
                                                !busy &&
                                                !['completed', 'cancelled'].includes(order.status)

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
                                                    className={`rounded-2xl border border-slate-200/90 bg-background p-3 shadow-[0_7px_20px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${
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
                                                        <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-[9px] font-semibold text-sky-500">
                                                            {order.customer?.name ?? 'Wanderer'}
                                                        </span>
                                                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] capitalize text-muted-foreground">
                                                            {order.status.replace(/_/g, ' ')}
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
        <section className="rounded-[24px] border border-slate-200/80 bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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

function CommissionSettingsSection({
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
        <section className="rounded-[24px] border border-slate-200/80 bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
    const approved = profile.application_status === 'approved'
    const allSelected =
        services.length > 0 && services.every((service) => selectedServiceIds.includes(service.id))

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
            client_fields: {
                ...DEFAULT_CLIENT_FIELDS,
                ...(service.client_fields ?? {}),
            },
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
        <section className="rounded-[24px] border border-slate-200/80 bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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
                            services
                                .filter((service) => selectedServiceIds.includes(service.id))
                                .forEach((service) => onDelete(service.slug))
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
                savedForms={normalizeRequestQuestions(profile.request_forms)}
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

function CommissionRequestsSection({ orders }: { orders: CommissionOrder[] }) {
    const navigate = useNavigate()
    const [requestTab, setRequestTab] = useState<'requests' | 'completed'>('requests')
    const visibleOrders = orders.filter((order) =>
        requestTab === 'completed' ? order.status === 'completed' : order.status !== 'completed'
    )

    return (
        <section className="rounded-[24px] border border-slate-200/80 bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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
                            <button
                                key={order.id}
                                type="button"
                                onClick={() => navigate(`/messages?order=${order.id}`)}
                                className="rounded-lg border bg-background p-3 text-left transition hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                                <p className="text-xs text-muted-foreground">
                                                    Name
                                                </p>
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
                        )
                    })}
                </div>
            )}
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
                                        <span className="font-semibold">
                                            {rating.rating}/5 stars
                                        </span>
                                        <span className="rounded-md border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                            {rating.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        From {rating.customer?.name ?? 'Wanderer'} ·{' '}
                                        {rating.service?.title ?? 'Commission'}
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

void CommissionRatingsSection

function CommissionRatingsSectionV2({
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
        <section className="rounded-[24px] border border-slate-200/80 bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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
                            <div className="font-medium">{rating.customer?.name ?? 'Wanderer'}</div>
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

    const updateClientField = (
        field: keyof ClientFields,
        patch: Partial<ClientFields[keyof ClientFields]>
    ) => {
        setForm((current) => ({
            ...current,
            client_fields: {
                ...current.client_fields,
                [field]: { ...current.client_fields[field], ...patch },
            },
        }))
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

    const updateSetup = (patch: Partial<SetupOptions>) => {
        setForm((current) => ({
            ...current,
            setup_options: { ...current.setup_options, ...patch },
        }))
    }

    const applyTermFormat = (prefix: string, suffix = '') => {
        const value = form.terms.trim()
        setField('terms', value ? `${prefix}${value}${suffix}` : prefix)
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
            <DialogContent className="flex h-[min(92dvh,920px)] w-[min(96vw,1180px)] max-w-none flex-col overflow-hidden p-0 sm:max-w-none">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>
                        {editing ? 'Edit Commission Service' : 'Add Commission Service'}
                    </DialogTitle>
                    <DialogDescription>
                        Set the public offer, quote rules, payment flow, refund policy, and required
                        references.
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
                                onChange={(event) => setField('description', event.target.value)}
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
                        <TabsTrigger value="client">Client Details</TabsTrigger>
                        <TabsTrigger value="licenses">Licenses</TabsTrigger>
                        <TabsTrigger value="terms">Terms</TabsTrigger>
                        <TabsTrigger value="flow">Flow</TabsTrigger>
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
                                            checked={form.setup_options.service_type === 'custom'}
                                            title="Custom"
                                            description="Made from scratch"
                                            onChange={() => updateSetup({ service_type: 'custom' })}
                                        />
                                        <RadioCard
                                            checked={
                                                form.setup_options.service_type === 'personalized'
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
                                                form.setup_options.communication_style === 'open'
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
                                    checked={form.setup_options.notify_followers_on_status_change}
                                    onChange={(checked) =>
                                        updateSetup({ notify_followers_on_status_change: checked })
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

                    <TabsContent value="terms" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextBlock
                                label="Quote rules"
                                value={form.quote_rules}
                                onChange={(value) => setField('quote_rules', value)}
                            />
                            <TextBlock
                                label="Required references"
                                value={form.required_references}
                                onChange={(value) => setField('required_references', value)}
                            />
                            <TextBlock
                                label="Refund policy"
                                value={form.refund_policy}
                                onChange={(value) => setField('refund_policy', value)}
                            />
                            <RichTextBlock
                                label="Terms of Service"
                                value={form.terms}
                                onChange={(value) => setField('terms', value)}
                                onFormat={applyTermFormat}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="questions" className="space-y-4">
                        {savedForms.length > 0 && (
                            <div className="rounded-lg border bg-muted/20 p-3">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold">Saved form questions</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Attach reusable questions from the Forms tab to this service.
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
                                                {attached ? 'Attached' : 'Attach'} {question.title}
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
                            onRemove={removeRequestQuestion}
                        />

                        <InfoQuestionsSection
                            items={form.info_questions}
                            onAdd={addInfoQuestion}
                            onUpdate={updateInfoQuestion}
                            onRemove={removeInfoQuestion}
                        />
                    </TabsContent>

                    <TabsContent value="client" className="space-y-4">
                        <ClientFieldsSection
                            fields={form.client_fields}
                            onUpdate={updateClientField}
                        />
                    </TabsContent>

                    <TabsContent value="promos" className="space-y-4">
                        <DiscountsSection
                            discounts={form.promo_discounts}
                            onAdd={addDiscount}
                            onUpdate={updateDiscount}
                            onRemove={removeDiscount}
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

                    <TabsContent value="flow" className="space-y-4">
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
                                            onChange={(event) =>
                                                setFlowStep(index, {
                                                    type: event.target.value as FlowType,
                                                })
                                            }
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
                                            onChange={(event) =>
                                                setFlowStep(index, { label: event.target.value })
                                            }
                                            placeholder="Step label"
                                        />
                                        <Input
                                            type="number"
                                            value={step.percent ?? 0}
                                            disabled={step.type !== 'pay'}
                                            onChange={(event) =>
                                                setFlowStep(index, {
                                                    percent: Number(event.target.value),
                                                })
                                            }
                                            placeholder="%"
                                        />
                                        <Input
                                            type="number"
                                            value={step.rounds ?? 0}
                                            disabled={!['sketch', 'revision'].includes(step.type)}
                                            onChange={(event) =>
                                                setFlowStep(index, {
                                                    rounds: Number(event.target.value),
                                                })
                                            }
                                            placeholder="Rounds"
                                        />
                                        <div className="flex gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => removeStep(index)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
    )
}

function NumberField({
    label,
    value,
    onChange,
}: {
    label: string
    value: number
    onChange: (value: number) => void
}) {
    return (
        <div>
            <Label>{label}</Label>
            <Input
                type="number"
                min={0}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </div>
    )
}

function TextBlock({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) {
    return (
        <div>
            <Label>{label}</Label>
            <Textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 min-h-24"
            />
        </div>
    )
}

function RichTextBlock({
    label,
    value,
    onChange,
    onFormat,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    onFormat: (prefix: string, suffix?: string) => void
}) {
    return (
        <div>
            <div className="flex items-center justify-between gap-2">
                <Label>{label}</Label>
                <div className="flex gap-1">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onFormat('## ')}
                    >
                        H
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onFormat('**', '**')}
                    >
                        B
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onFormat('- ')}
                    >
                        Bullet
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onFormat('||', '||')}
                    >
                        Spoiler
                    </Button>
                </div>
            </div>
            <Textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 min-h-32"
            />
            <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Live preview
                </p>
                <RichTextPreview value={value} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
                Supports simple markdown-style headings, bold text, bullets, and spoiler highlights.
            </p>
        </div>
    )
}

function RichTextPreview({ value }: { value: string }) {
    const lines = value.trim() ? value.split(/\r?\n/) : ['Preview text will appear here.']

    return (
        <div className="space-y-1 text-sm leading-relaxed text-foreground">
            {lines.map((line, index) => {
                const content = line.replace(/^#{1,3}\s+/, '').replace(/^-\s+/, '')
                const inline = renderInlineRichText(content, index)

                if (/^#{1,3}\s+/.test(line)) {
                    return (
                        <h3 key={index} className="text-base font-bold">
                            {inline}
                        </h3>
                    )
                }

                if (/^-\s+/.test(line)) {
                    return (
                        <div key={index} className="flex gap-2">
                            <span className="mt-0.5 text-muted-foreground">•</span>
                            <span>{inline}</span>
                        </div>
                    )
                }

                return <p key={index}>{inline}</p>
            })}
        </div>
    )
}

function renderInlineRichText(text: string, lineIndex: number): ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*|\|\|[^|]+\|\|)/g)

    return parts.map((part, index) => {
        const key = `${lineIndex}-${index}`
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={key}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('||') && part.endsWith('||')) {
            return (
                <span key={key} className="rounded bg-yellow-200 px-1 text-yellow-950">
                    {part.slice(2, -2)}
                </span>
            )
        }

        return <span key={key}>{part}</span>
    })
}

function SelectField({
    label,
    value,
    options,
    onChange,
}: {
    label: string
    value: string
    options: Array<[string, string]>
    onChange: (value: string) => void
}) {
    return (
        <div>
            <Label>{label}</Label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </div>
    )
}

function FlowEditor({
    flow,
    setFlow,
    onUpdate,
    onMove,
}: {
    flow: FlowStep[]
    setFlow: React.Dispatch<React.SetStateAction<FlowStep[]>>
    onUpdate: (index: number, patch: Partial<FlowStep>) => void
    onMove: (index: number, target: number) => void
}) {
    const handleDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
        event.dataTransfer.setData('text/plain', String(index))
        event.dataTransfer.effectAllowed = 'move'
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>, targetIndex: number) => {
        event.preventDefault()
        const sourceIndex = Number(event.dataTransfer.getData('text/plain'))
        if (Number.isInteger(sourceIndex) && sourceIndex !== targetIndex)
            onMove(sourceIndex, targetIndex)
    }

    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold">Default commission flow</h3>
                    <p className="text-xs text-muted-foreground">
                        Drag payment, sketch, revision, custom, and delivery steps into the order
                        you use most.
                    </p>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        setFlow((current) => [...current, { type: 'add', label: 'Custom step' }])
                    }
                >
                    Add step
                </Button>
            </div>
            <div className="grid gap-2">
                {flow.map((step, index) => (
                    <div
                        key={`${step.label}-${index}`}
                        draggable
                        onDragStart={(event) => handleDragStart(event, index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleDrop(event, index)}
                        className="grid cursor-grab gap-2 rounded-lg border p-2 active:cursor-grabbing md:grid-cols-[34px_110px_1fr_90px_90px_auto]"
                    >
                        <div className="flex h-9 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                            {index + 1}
                        </div>
                        <select
                            value={step.type}
                            onChange={(event) =>
                                onUpdate(index, { type: event.target.value as FlowType })
                            }
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
                            onChange={(event) => onUpdate(index, { label: event.target.value })}
                            placeholder="Step label"
                        />
                        <Input
                            type="number"
                            value={step.percent ?? 0}
                            disabled={step.type !== 'pay'}
                            onChange={(event) =>
                                onUpdate(index, { percent: Number(event.target.value) })
                            }
                            placeholder="%"
                        />
                        <Input
                            type="number"
                            value={step.rounds ?? 0}
                            disabled={!['sketch', 'revision', 'add'].includes(step.type)}
                            onChange={(event) =>
                                onUpdate(index, { rounds: Number(event.target.value) })
                            }
                            placeholder="Count"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                                setFlow((current) =>
                                    current.filter((_, stepIndex) => stepIndex !== index)
                                )
                            }
                        >
                            Delete
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function RadioCard({
    checked,
    title,
    description,
    onChange,
}: {
    checked: boolean
    title: string
    description: string
    onChange: () => void
}) {
    return (
        <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition ${
                checked ? 'border-foreground bg-muted/50' : 'bg-background hover:bg-muted/30'
            }`}
        >
            <input type="radio" checked={checked} onChange={onChange} className="mt-1 h-4 w-4" />
            <span>
                <span className="block font-semibold uppercase">{title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
            </span>
        </label>
    )
}

function ToggleLine({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            <span>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4"
            />
        </label>
    )
}

function RequestQuestionsSection({
    questions,
    onAdd,
    onUpdate,
    onRemove,
}: {
    questions: RequestQuestion[]
    onAdd: () => void
    onUpdate: (index: number, patch: Partial<RequestQuestion>) => void
    onRemove: (index: number) => void
}) {
    const handleQuestionTypeChange = (questionIndex: number, type: RequestQuestion['type']) => {
        const currentQuestion = questions[questionIndex]

        onUpdate(questionIndex, {
            type,
            options:
                type === 'multiple_choice'
                    ? currentQuestion.options.length > 0
                        ? currentQuestion.options
                        : ['Option 1']
                    : [],
        })
    }

    const handleAddOption = (questionIndex: number) => {
        const currentOptions = questions[questionIndex].options

        onUpdate(questionIndex, {
            options: [...currentOptions, `Option ${currentOptions.length + 1}`],
        })
    }

    const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updatedOptions = questions[questionIndex].options.map((option, index) =>
            index === optionIndex ? value : option
        )

        onUpdate(questionIndex, {
            options: updatedOptions,
        })
    }

    const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
        const updatedOptions = questions[questionIndex].options.filter(
            (_, index) => index !== optionIndex
        )

        onUpdate(questionIndex, {
            options: updatedOptions,
        })
    }

    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-sm font-semibold">Request form questions</h3>

                    <p className="text-xs text-muted-foreground">
                        Ask wanderers for the details you need before quoting.
                    </p>
                </div>

                <Button type="button" size="sm" variant="outline" onClick={onAdd}>
                    <PlusCircle className="h-4 w-4" />
                    Add question
                </Button>
            </div>

            <div className="grid gap-3">
                {questions.map((question, questionIndex) => (
                    <div key={question.id} className="rounded-lg border bg-muted/20 p-3">
                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_170px]">
                            <Input
                                value={question.title}
                                onChange={(event) =>
                                    onUpdate(questionIndex, {
                                        title: event.target.value,
                                    })
                                }
                                placeholder="Question title"
                            />

                            <select
                                value={question.type}
                                onChange={(event) =>
                                    handleQuestionTypeChange(
                                        questionIndex,
                                        event.target.value as RequestQuestion['type']
                                    )
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                <option value="textarea">Textarea</option>

                                <option value="short_text">Short text</option>

                                <option value="multiple_choice">Multiple choice</option>

                                <option value="date">Date</option>

                                <option value="checkbox">Checkbox</option>
                            </select>
                        </div>

                        <Textarea
                            value={question.description}
                            onChange={(event) =>
                                onUpdate(questionIndex, {
                                    description: event.target.value,
                                })
                            }
                            className="mt-2 min-h-16"
                            placeholder="Optional helper text or description"
                        />

                        {question.type === 'multiple_choice' && (
                            <div className="mt-3 rounded-lg border bg-background p-3">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-medium">
                                            Multiple-choice options
                                        </h4>

                                        <p className="text-xs text-muted-foreground">
                                            Add the choices the user can select from.
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddOption(questionIndex)}
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        Add option
                                    </Button>
                                </div>

                                <div className="grid gap-2">
                                    {question.options.map((option, optionIndex) => (
                                        <div
                                            key={`${question.id}-option-${optionIndex}`}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted/30 text-xs font-semibold text-muted-foreground">
                                                {optionIndex + 1}
                                            </div>

                                            <Input
                                                value={option}
                                                onChange={(event) =>
                                                    handleUpdateOption(
                                                        questionIndex,
                                                        optionIndex,
                                                        event.target.value
                                                    )
                                                }
                                                placeholder={`Option ${optionIndex + 1}`}
                                            />

                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() =>
                                                    handleRemoveOption(questionIndex, optionIndex)
                                                }
                                                aria-label={`Delete option ${optionIndex + 1}`}
                                                title="Delete option"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {question.options.length === 0 && (
                                        <div className="rounded-lg border border-dashed p-4 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                No options added yet.
                                            </p>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="mt-3"
                                                onClick={() => handleAddOption(questionIndex)}
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                                Create first option
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {question.type === 'checkbox' && (
                            <div className="mt-3 rounded-lg border bg-background p-3">
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        disabled
                                        className="mt-0.5 h-4 w-4 rounded border"
                                    />

                                    <div>
                                        <p className="text-sm font-medium">
                                            {question.title || 'Checkbox question'}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            The user can check or uncheck this single option.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        )}

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={(event) =>
                                        onUpdate(questionIndex, {
                                            required: event.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded border"
                                />
                                Required
                            </label>

                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => onRemove(questionIndex)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete question
                            </Button>
                        </div>
                    </div>
                ))}

                {questions.length === 0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            No custom request questions yet.
                        </p>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={onAdd}
                        >
                            <PlusCircle className="h-4 w-4" />
                            Create first question
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

function InfoQuestionsSection({
    items,
    onAdd,
    onUpdate,
    onRemove,
}: {
    items: InfoQuestion[]
    onAdd: () => void
    onUpdate: (index: number, patch: Partial<InfoQuestion>) => void
    onRemove: (index: number) => void
}) {
    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold">Public questions and answers</h3>
                    <p className="text-xs text-muted-foreground">
                        Show helpful answers before wanderers request.
                    </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={onAdd}>
                    Add Q&A
                </Button>
            </div>
            <div className="grid gap-3">
                {items.map((item, index) => (
                    <div key={item.id} className="rounded-lg border bg-muted/20 p-3">
                        <Input
                            value={item.question}
                            onChange={(event) => onUpdate(index, { question: event.target.value })}
                            placeholder="Question"
                        />
                        <Textarea
                            value={item.answer}
                            onChange={(event) => onUpdate(index, { answer: event.target.value })}
                            className="mt-2 min-h-20"
                            placeholder="Answer"
                        />
                        <div className="mt-2 flex justify-end">
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => onRemove(index)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        No public Q&A yet.
                    </p>
                )}
            </div>
        </div>
    )
}

function LicenseSection({
    questions,
    onUpdate,
    onAdd,
}: {
    questions: RequestQuestion[]
    onUpdate: (index: number, patch: Partial<RequestQuestion>) => void
    onAdd: () => void
}) {
    const licenseIndex = questions.findIndex(
        (question) => question.id === DEFAULT_LICENSE_QUESTION.id
    )
    const license = licenseIndex >= 0 ? questions[licenseIndex] : null
    const [customLicense, setCustomLicense] = useState('')

    if (!license) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center">
                <h3 className="text-sm font-semibold">Licenses</h3>
                <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
                    Add the default license question so wanderers can choose Personal, Commercial
                    Content, or Commercial Merchandising.
                </p>
                <Button type="button" className="mt-4" variant="outline" onClick={onAdd}>
                    Add default licenses
                </Button>
            </div>
        )
    }

    const selectedOptions = license.options ?? []
    const defaultOptions = defaultLicenseOptions()
    const customOptions = selectedOptions.filter((option) => !defaultOptions.includes(option))
    const visibleOptions = [...defaultOptions, ...customOptions]

    const toggleLicense = (option: string, checked: boolean) => {
        const next = checked
            ? [...selectedOptions, option]
            : selectedOptions.filter((item) => item !== option)

        onUpdate(licenseIndex, { options: Array.from(new Set(next)) })
    }

    const addCustomLicense = () => {
        const value = customLicense.trim()
        if (!value) {
            toast.error('Write the custom license first.')
            return
        }

        toggleLicense(value, true)
        setCustomLicense('')
    }

    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3">
                <h3 className="text-sm font-semibold">Licenses</h3>
                <p className="text-xs text-muted-foreground">
                    This appears in the wanderer request form.
                </p>
            </div>
            <div className="grid gap-3">
                <div>
                    <Label>Question</Label>
                    <Input
                        value={license.title}
                        onChange={(event) => onUpdate(licenseIndex, { title: event.target.value })}
                    />
                </div>
                <div>
                    <Label>Helper text</Label>
                    <Input
                        value={license.description}
                        onChange={(event) =>
                            onUpdate(licenseIndex, { description: event.target.value })
                        }
                    />
                </div>
                <div className="space-y-2">
                    <Label>License choices</Label>
                    {visibleOptions.map((option) => {
                        const checked = selectedOptions.includes(option)
                        const isCustom = !defaultOptions.includes(option)

                        return (
                            <div
                                key={option}
                                className="flex items-center gap-3 rounded-lg border px-3 py-2"
                            >
                                <label className="flex flex-1 items-start gap-3 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) =>
                                            toggleLicense(option, event.target.checked)
                                        }
                                        className="mt-0.5 h-4 w-4"
                                    />
                                    <span>
                                        <span className="font-medium">
                                            {licenseOptionTitle(option)}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {licenseOptionDescription(option)}
                                        </span>
                                    </span>
                                </label>
                                {isCustom && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleLicense(option, false)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                    <div className="flex gap-2">
                        <Input
                            value={customLicense}
                            onChange={(event) => setCustomLicense(event.target.value)}
                            placeholder="Other license, for example NDA required or streaming allowed"
                        />
                        <Button type="button" variant="outline" onClick={addCustomLicense}>
                            Add custom
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Toggle the license choices that wanderers can select. Custom licenses appear
                        with the defaults.
                    </p>
                </div>
                <ToggleLine
                    label="Required"
                    checked={license.required}
                    onChange={(checked) => onUpdate(licenseIndex, { required: checked })}
                />
            </div>
        </div>
    )
}

function licenseOptionTitle(option: string) {
    return option.split(' - ')[0] ?? option
}

function licenseOptionDescription(option: string) {
    const [, description] = option.split(' - ')
    return description ?? option
}

function ClientFieldsSection({
    fields,
    onUpdate,
}: {
    fields: ClientFields
    onUpdate: (field: keyof ClientFields, patch: Partial<ClientFields[keyof ClientFields]>) => void
}) {
    const labels: Record<keyof ClientFields, string> = {
        name: 'Name',
        nickname: 'Nickname',
        email: 'Email',
        discord: 'Discord',
        twitter: 'Twitter / X',
        instagram: 'Instagram',
        facebook: 'Facebook',
        tiktok: 'TikTok',
    }

    return (
        <div className="rounded-lg border p-3">
            <h3 className="text-sm font-semibold">Wanderer details</h3>
            <p className="mb-3 text-xs text-muted-foreground">
                Choose what contact details the artist may collect.
            </p>
            <div className="grid gap-2">
                <div className="grid items-center gap-2 rounded-lg border px-3 py-2 text-sm md:grid-cols-[1fr_auto]">
                    <span>{labels.name}</span>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={fields.name.required}
                            onChange={(event) =>
                                onUpdate('name', {
                                    collect: true,
                                    required: event.target.checked,
                                })
                            }
                            className="h-4 w-4"
                        />
                        Required / not
                    </label>
                </div>
                <div className="grid items-center gap-2 rounded-lg border px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto]">
                    <span>{labels.email}</span>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={fields.email.required}
                            onChange={(event) =>
                                onUpdate('email', {
                                    collect: true,
                                    required: event.target.checked,
                                })
                            }
                            className="h-4 w-4"
                        />
                        Required for guest
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={fields.email.required}
                            onChange={(event) =>
                                onUpdate('email', {
                                    collect: true,
                                    required: event.target.checked,
                                })
                            }
                            className="h-4 w-4"
                        />
                        Required for wanderers
                    </label>
                </div>
                {(['discord', 'twitter', 'instagram', 'facebook'] as Array<keyof ClientFields>).map(
                    (field) => (
                        <div
                            key={field}
                            className="grid items-center gap-2 rounded-lg border px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto]"
                        >
                            <span>{labels[field]}</span>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={fields[field].collect}
                                    onChange={(event) =>
                                        onUpdate(field, { collect: event.target.checked })
                                    }
                                    className="h-4 w-4"
                                />
                                Collect
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={fields[field].required}
                                    disabled={!fields[field].collect}
                                    onChange={(event) =>
                                        onUpdate(field, { required: event.target.checked })
                                    }
                                    className="h-4 w-4"
                                />
                                Required / not
                            </label>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

function DiscountsSection({
    discounts,
    onAdd,
    onUpdate,
    onRemove,
}: {
    discounts: PromoDiscount[]
    onAdd: () => void
    onUpdate: (index: number, patch: Partial<PromoDiscount>) => void
    onRemove: (index: number) => void
}) {
    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold">Discount promos</h3>
                    <p className="text-xs text-muted-foreground">
                        Create optional promo discounts for this service.
                    </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={onAdd}>
                    Add discount
                </Button>
            </div>
            <div className="grid gap-3">
                {discounts.map((discount, index) => (
                    <div
                        key={discount.id}
                        className="grid gap-2 rounded-lg border bg-muted/20 p-3 md:grid-cols-[1fr_120px_120px_150px_150px_auto]"
                    >
                        <Input
                            value={discount.label}
                            onChange={(event) => onUpdate(index, { label: event.target.value })}
                            placeholder="Promo name"
                        />
                        <select
                            value={discount.type}
                            onChange={(event) =>
                                onUpdate(index, {
                                    type: event.target.value as PromoDiscount['type'],
                                })
                            }
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="percent">Percent</option>
                            <option value="fixed">Fixed</option>
                        </select>
                        <Input
                            type="number"
                            value={discount.amount}
                            onChange={(event) =>
                                onUpdate(index, { amount: Number(event.target.value) })
                            }
                        />
                        <Input
                            type="date"
                            value={discount.starts_at}
                            onChange={(event) => onUpdate(index, { starts_at: event.target.value })}
                        />
                        <Input
                            type="date"
                            value={discount.ends_at}
                            onChange={(event) => onUpdate(index, { ends_at: event.target.value })}
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => onRemove(index)}
                        >
                            Delete
                        </Button>
                    </div>
                ))}
                {discounts.length === 0 && (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        No discount promos yet.
                    </p>
                )}
            </div>
        </div>
    )
}

function buildServicePayload(form: ServiceForm): FormData {
    const payload = new FormData()
    payload.append('title', form.title.trim())
    payload.append('commission_category_id', form.commission_category_id)
    payload.append('description', form.description.trim())
    payload.append('base_price_credits', String(form.base_price_credits))
    payload.append('min_price_credits', String(form.base_price_credits))
    payload.append('delivery_days', String(form.delivery_days))
    payload.append('slots_available', String(form.slots_available))
    payload.append('status', form.status)
    payload.append('is_published', form.is_published ? '1' : '0')
    payload.append('terms', form.terms.trim())
    payload.append('quote_rules', form.quote_rules.trim())
    payload.append('refund_policy', form.refund_policy.trim())
    payload.append('required_references', form.required_references.trim())
    form.request_questions.forEach((question, index) => {
        payload.append(`request_questions[${index}][id]`, question.id)
        payload.append(`request_questions[${index}][title]`, question.title)
        payload.append(`request_questions[${index}][description]`, question.description)
        payload.append(`request_questions[${index}][type]`, question.type)
        payload.append(`request_questions[${index}][required]`, question.required ? '1' : '0')
        question.options.forEach((option, optionIndex) => {
            payload.append(`request_questions[${index}][options][${optionIndex}]`, option)
        })
    })
    form.info_questions.forEach((item, index) => {
        payload.append(`info_questions[${index}][id]`, item.id)
        payload.append(`info_questions[${index}][question]`, item.question)
        payload.append(`info_questions[${index}][answer]`, item.answer)
    })
    Object.entries(form.client_fields).forEach(([field, config]) => {
        payload.append(`client_fields[${field}][collect]`, config.collect ? '1' : '0')
        payload.append(`client_fields[${field}][required]`, config.required ? '1' : '0')
    })
    form.promo_discounts.forEach((discount, index) => {
        payload.append(`promo_discounts[${index}][id]`, discount.id)
        payload.append(`promo_discounts[${index}][label]`, discount.label)
        payload.append(`promo_discounts[${index}][type]`, discount.type)
        payload.append(`promo_discounts[${index}][amount]`, String(discount.amount))
        if (discount.starts_at)
            payload.append(`promo_discounts[${index}][starts_at]`, discount.starts_at)
        if (discount.ends_at) payload.append(`promo_discounts[${index}][ends_at]`, discount.ends_at)
        payload.append(`promo_discounts[${index}][active]`, discount.active ? '1' : '0')
    })
    Object.entries({
        ...form.setup_options,
        guaranteed_delivery_days: form.delivery_days,
    }).forEach(([key, value]) => {
        payload.append(
            `setup_options[${key}]`,
            typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? '')
        )
    })
    if (form.image) payload.append('image', form.image)
    form.flow.forEach((step, index) => {
        payload.append(`flow[${index}][type]`, step.type)
        payload.append(`flow[${index}][label]`, step.label)
        if (typeof step.percent === 'number')
            payload.append(`flow[${index}][percent]`, String(step.percent))
        if (typeof step.rounds === 'number')
            payload.append(`flow[${index}][rounds]`, String(step.rounds))
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
