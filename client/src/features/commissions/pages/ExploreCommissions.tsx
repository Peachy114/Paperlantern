import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type ComponentType,
    type ReactNode,
} from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import {
    BadgeCheck,
    BriefcaseBusiness,
    CalendarClock,
    Coins,
    ImagePlus,
    Maximize2,
    ShieldCheck,
    Star,
    Users,
} from 'lucide-react'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import { useAuthStore, type User } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { toast } from 'sonner'
import type {
    CommissionFlowStep,
    CommissionRating,
    CommissionService,
    CommissionsResponse,
} from '@/types/commission'
import type { PageLayout, PageWidget } from '@/types/pageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { CommissionPageWidgets } from '@/features/page-builder/CommissionPageWidgets'

const statusLabel: Record<CommissionService['status'], string> = {
    open: 'Open',
    waitlist: 'Waitlist',
    closed: 'Closed',
    paused: 'Paused',
}

const statusClass: Record<CommissionService['status'], string> = {
    open: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    waitlist: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    closed: 'border-muted-foreground/30 bg-muted text-muted-foreground',
    paused: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
}

const defaultCommissionWidgets: PageWidget[] = [
    {
        id: 'default-commission-grid',
        type: 'commission_grid',
        title: 'Open Commissions',
        enabled: true,
        settings: { grid: 'masonry' },
        style: { transparent: true, border: false, radius: 0, padding: 0, margin: 0, z_index: 1 },
    },
]

const REFERENCE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const REFERENCE_IMAGE_MAX_BYTES = 10 * 1024 * 1024

interface CommissionExploreResponse extends CommissionsResponse {
    layout: PageLayout
}

export default function ExploreCommissions() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [selectedCommission, setSelectedCommission] = useState<CommissionService | null>(null)

    const params = useMemo(() => {
        const next = new URLSearchParams()
        for (const key of ['q', 'category', 'sort']) {
            const value = searchParams.get(key)
            if (value) next.set(key, value)
        }
        return next
    }, [searchParams])

    const { data, isLoading } = useQuery<CommissionExploreResponse>({
        queryKey: ['public-commissions', params.toString()],
        queryFn: () => publicApi.getCommissions(params).then((res) => res.data),
    })

    const commissions = data?.commissions.data ?? []
    const categories = data?.categories ?? []
    const activeCategory = searchParams.get('category') ?? ''

    const featuredCommissions = commissions.filter((commission) => commission.is_featured)
    const boostedCommissions = commissions.filter((commission) => commission.boosted_until)

    const visibleWidgets = useMemo(() => {
        const widgets = (data?.layout.widgets ?? defaultCommissionWidgets).filter(
            (widget) => widget.enabled
        )
        const hasCommissionGrid = widgets.some(
            (widget) => widget.type === 'commission_grid' || widget.type === 'boosted_commissions'
        )

        return hasCommissionGrid ? widgets : [...widgets, defaultCommissionWidgets[0]]
    }, [data?.layout.widgets])

    const setFilter = (key: 'category', value: string) => {
        const next = new URLSearchParams(searchParams)
        if (next.get(key) === value || value === '') next.delete(key)
        else next.set(key, value)
        setSearchParams(next)
    }

    return (
        <div className="relative mx-auto px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Explore
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">Commission</h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Browse artist commission openings, waitlists, prices, terms, and public
                        ratings.
                    </p>
                </div>
            </div>

            <CommissionDialog
                commission={selectedCommission}
                open={Boolean(selectedCommission)}
                onOpenChange={(open) => {
                    if (!open) setSelectedCommission(null)
                }}
            />
            <CommissionPageWidgets
                widgets={visibleWidgets}
                data={{
                    commissions,
                    featuredCommissions,
                    boostedCommissions,
                    categories,
                    activeCategory,
                    onCategoryChange: (value) => setFilter('category', value),
                    isLoading,
                    onOpen: setSelectedCommission,
                }}
            />
        </div>
    )
}

function DefaultCommissionImage({
    className = '',
    large = false,
}: {
    className?: string
    large?: boolean
}) {
    return (
        <div
            className={`flex w-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))] ${className}`}
        >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <BriefcaseBusiness className={large ? 'h-14 w-14' : 'h-8 w-8'} />
                <span className={large ? 'text-sm font-medium' : 'sr-only'}>
                    Commission preview
                </span>
            </div>
        </div>
    )
}

function CommissionDialog({
    commission,
    open,
    onOpenChange,
}: {
    commission: CommissionService | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const navigate = useNavigate()
    const { token } = useAuthStore()
    const user = useAuthStore((state) => state.user)
    const { openLogin } = useModalStore()
    const [requestOpen, setRequestOpen] = useState(false)
    const [requestMessage, setRequestMessage] = useState('')
    const [referenceNotes, setReferenceNotes] = useState('')
    const [referenceImage, setReferenceImage] = useState<File | null>(null)
    const [agree, setAgree] = useState(false)
    const [requestAnswers, setRequestAnswers] = useState<Record<string, string>>({})
    const [clientDetails, setClientDetails] = useState<Record<string, string>>({})
    const [requestErrors, setRequestErrors] = useState<Record<string, string>>({})
    const [termsOpen, setTermsOpen] = useState(false)
    const requestMutation = useMutation({
        mutationFn: () => {
            const identifier = commission?.slug
            if (!identifier) {
                throw new Error(
                    'This commission is missing a public link. Please refresh and try again.'
                )
            }

            const trimmedMessage = requestMessage.trim()
            const trimmedNotes = referenceNotes.trim()
            if (trimmedMessage.length < 10) {
                setRequestErrors({
                    request_message:
                        'Please describe your commission request in at least 10 characters.',
                })
                throw new Error('Please complete the required fields.')
            }
            const nextErrors: Record<string, string> = {}
            for (const question of commission.request_questions ?? []) {
                const key = question.id || question.title
                if (question.required && !requestAnswers[key]?.trim()) {
                    nextErrors[`question_${key}`] =
                        `Please answer: ${question.title || 'Required question'}`
                }
            }
            for (const [field, config] of Object.entries(commission.client_fields ?? {})) {
                if (config.collect && config.required && !clientDetails[field]?.trim()) {
                    nextErrors[`client_${field}`] =
                        `Please provide your ${clientFieldLabel(field).toLowerCase()}.`
                }
            }
            if (Object.keys(nextErrors).length > 0) {
                setRequestErrors(nextErrors)
                throw new Error(Object.values(nextErrors)[0])
            }
            if (!agree) {
                setRequestErrors({ agree_to_flow: 'Please confirm the commission flow and terms.' })
                throw new Error('Please complete the required fields.')
            }
            if (referenceImage && !isValidReferenceImage(referenceImage)) {
                setRequestErrors({
                    reference_image: 'Upload a JPG, PNG, WEBP, or GIF up to 10 MB.',
                })
                throw new Error('Please choose a supported reference image.')
            }

            const payload = new FormData()
            payload.append('request_message', trimmedMessage)
            if (trimmedNotes) payload.append('reference_notes', trimmedNotes)
            payload.append('agree_to_flow', agree ? '1' : '0')
            if (referenceImage) payload.append('reference_image', referenceImage)
            ;(commission.request_questions ?? []).forEach((question, index) => {
                const key = question.id || question.title
                payload.append(`request_answers[${index}][question_id]`, question.id)
                payload.append(`request_answers[${index}][question]`, question.title)
                payload.append(
                    `request_answers[${index}][answer]`,
                    requestAnswers[key]?.trim() ?? ''
                )
            })
            Object.entries(commission.client_fields ?? {}).forEach(([field, config]) => {
                if (config.collect && clientDetails[field]?.trim()) {
                    payload.append(`client_details[${field}]`, clientDetails[field].trim())
                }
            })
            return publicApi.requestCommission(identifier, payload)
        },
        onSuccess: (response) => {
            const orderId = response?.data?.order?.id
            toast.success('Commission request sent.')
            setRequestOpen(false)
            onOpenChange(false)
            setRequestMessage('')
            setReferenceNotes('')
            setReferenceImage(null)
            setAgree(false)
            setRequestAnswers({})
            setClientDetails({})
            setRequestErrors({})
            navigate(orderId ? `/messages?order=${orderId}` : '/messages')
        },
        onError: (error: any) => {
            const errors = flattenValidationErrors(error?.response?.data?.errors)
            if (Object.keys(errors).length > 0) {
                setRequestErrors(errors)
                toast.error(Object.values(errors)[0])
                return
            }

            toast.error(
                error?.response?.data?.message ?? error?.message ?? 'Could not request commission.'
            )
        },
    })

    useEffect(() => {
        if (!requestOpen || !commission || !user) return

        setClientDetails((current) => ({
            ...profileClientDetails(user),
            ...current,
        }))
    }, [requestOpen, commission?.id, user?.id])

    if (!commission) return null

    const image = commission.image_path
    const attachReferenceImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        if (!file) {
            setReferenceImage(null)
            return
        }

        if (!isValidReferenceImage(file)) {
            setReferenceImage(null)
            setRequestErrors((current) => ({
                ...current,
                reference_image: 'Upload a JPG, PNG, WEBP, or GIF up to 10 MB.',
            }))
            toast.error('Upload a JPG, PNG, WEBP, or GIF up to 10 MB.')
            event.target.value = ''
            return
        }

        setRequestErrors((current) => {
            const next = { ...current }
            delete next.reference_image
            return next
        })
        setReferenceImage(file)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="h-[92dvh] !w-[calc(100vw-0.75rem)] !max-w-none overflow-hidden p-0 sm:!max-w-none lg:!w-[min(96vw,1320px)]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{commission.title}</DialogTitle>
                        <DialogDescription>{commission.description}</DialogDescription>
                    </DialogHeader>

                    <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
                        <div className="min-h-[280px] bg-muted">
                            {image ? (
                                <img
                                    src={storageUrl(image)!}
                                    alt={commission.title}
                                    draggable={false}
                                    onContextMenu={(event) => event.preventDefault()}
                                    onDragStart={(event) => event.preventDefault()}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <DefaultCommissionImage className="h-full min-h-[280px]" large />
                            )}
                        </div>

                        <div className="flex min-h-0 flex-col">
                            <div className="min-h-0 flex-1 overflow-y-auto p-5">
                                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <Badge
                                                className={statusClass[commission.status]}
                                                variant="outline"
                                            >
                                                {statusLabel[commission.status]}
                                            </Badge>
                                            {commission.category && (
                                                <Badge variant="secondary">
                                                    {commission.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="text-2xl font-bold tracking-tight">
                                            {commission.title}
                                        </h2>
                                        {commission.artist && (
                                            <Link
                                                to={`/artists/${commission.artist.username}`}
                                                className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                            >
                                                {commission.artist.avatar ? (
                                                    <img
                                                        src={storageUrl(commission.artist.avatar)!}
                                                        alt={commission.artist.name}
                                                        className="h-7 w-7 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                                        {commission.artist.name[0]?.toUpperCase() ??
                                                            'A'}
                                                    </span>
                                                )}
                                                <span>{commission.artist.name}</span>
                                                {commission.artist.artist_verified && (
                                                    <BadgeCheck className="h-4 w-4 text-sky-500" />
                                                )}
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <Metric
                                        icon={Coins}
                                        label="Starts at"
                                        value={`${commission.base_price_credits} credits`}
                                    />
                                    <Metric
                                        icon={CalendarClock}
                                        label="Delivery"
                                        value={
                                            commission.delivery_days
                                                ? `${commission.delivery_days} days`
                                                : 'Quote'
                                        }
                                    />
                                    <Metric
                                        icon={Star}
                                        label="Rating"
                                        value={
                                            commission.ratings_count > 0
                                                ? `${commission.rating_average.toFixed(1)} (${commission.ratings_count})`
                                                : 'New'
                                        }
                                    />
                                    <Metric
                                        icon={Users}
                                        label="Customers"
                                        value={`${commission.customers_count}`}
                                    />
                                </div>

                                {commission.description && (
                                    <p className="mb-5 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                                        {commission.description}
                                    </p>
                                )}

                                <SectionTitle>Commission Flow</SectionTitle>
                                <FlowPreview flow={commission.flow} />

                                <Separator className="my-5" />

                                {(commission.info_questions?.length ?? 0) > 0 && (
                                    <>
                                        <SectionTitle>Before You Request</SectionTitle>
                                        <div className="space-y-2">
                                            {commission.info_questions.map((item) => (
                                                <div
                                                    key={item.id || item.question}
                                                    className="rounded-lg border bg-background p-3"
                                                >
                                                    <p className="text-sm font-semibold">
                                                        {item.question}
                                                    </p>
                                                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                                                        {item.answer}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator className="my-5" />
                                    </>
                                )}

                                <SectionTitle>Terms</SectionTitle>
                                <div className="space-y-3">
                                    {commission.quote_rules && (
                                        <TermBlock
                                            title="Quote rules"
                                            text={commission.quote_rules}
                                        />
                                    )}
                                    {commission.required_references && (
                                        <TermBlock
                                            title="Required references"
                                            text={commission.required_references}
                                        />
                                    )}
                                    {commission.refund_policy && (
                                        <TermBlock
                                            title="Refund policy"
                                            text={commission.refund_policy}
                                        />
                                    )}
                                    {commission.terms && (
                                        <TermBlock title="Service terms" text={commission.terms} />
                                    )}
                                    {commission.artist_terms && (
                                        <TermBlock
                                            title="Artist terms"
                                            text={commission.artist_terms}
                                        />
                                    )}
                                    <div className="rounded-lg border bg-muted/20 p-3">
                                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                            <ShieldCheck className="h-4 w-4" />
                                            Platform terms
                                        </div>
                                        <ul className="space-y-1 text-sm text-muted-foreground">
                                            {commission.platform_terms.map((term) => (
                                                <li key={term}>{term}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <Separator className="my-5" />

                                <SectionTitle>Ratings</SectionTitle>
                                <RatingsList ratings={commission.recent_ratings} />
                            </div>

                            <div className="border-t bg-background p-4">
                                <Button
                                    className="w-full"
                                    disabled={commission.status === 'closed'}
                                    onClick={() => {
                                        if (!token) {
                                            openLogin()
                                            return
                                        }
                                        setRequestOpen(true)
                                    }}
                                >
                                    {commission.status === 'closed'
                                        ? 'Commission closed'
                                        : commission.status === 'waitlist'
                                          ? 'Join waitlist'
                                          : 'Request commission'}
                                </Button>
                                <p className="mt-2 text-center text-xs text-muted-foreground">
                                    You will review the artist flow and quote before credits are
                                    charged.
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Request commission</DialogTitle>
                        <DialogDescription>
                            Your request opens a message thread first. The artist can ask questions
                            and send a quote before you pay.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <LabelText>Message to artist</LabelText>
                            <textarea
                                value={requestMessage}
                                onChange={(event) => {
                                    setRequestMessage(event.target.value)
                                    setRequestErrors((current) => {
                                        const next = { ...current }
                                        delete next.request_message
                                        return next
                                    })
                                }}
                                className="mt-1 min-h-28 w-full rounded-md border bg-background p-3 text-sm"
                                placeholder="Describe what you want, size, style, character, deadline, and any important notes."
                            />
                            {requestErrors.request_message && (
                                <p className="mt-1 text-xs text-destructive">
                                    {requestErrors.request_message}
                                </p>
                            )}
                        </div>
                        {(commission.request_questions?.length ?? 0) > 0 && (
                            <div className="space-y-3 rounded-lg border p-3">
                                <p className="text-sm font-semibold">Artist questions</p>
                                {commission.request_questions.map((question) => {
                                    const key = question.id || question.title
                                    return (
                                        <RequestQuestionInput
                                            key={key}
                                            question={question}
                                            value={requestAnswers[key] ?? ''}
                                            error={requestErrors[`question_${key}`]}
                                            onChange={(value) => {
                                                setRequestAnswers((current) => ({
                                                    ...current,
                                                    [key]: value,
                                                }))
                                                setRequestErrors((current) => {
                                                    const next = { ...current }
                                                    delete next[`question_${key}`]
                                                    return next
                                                })
                                            }}
                                        />
                                    )
                                })}
                            </div>
                        )}
                        {hasCollectedClientFields(commission.client_fields) && (
                            <div className="space-y-3 rounded-lg border p-3">
                                <p className="text-sm font-semibold">Wanderer details</p>
                                <p className="text-xs text-muted-foreground">
                                    The artist can see only the fields requested here.
                                </p>
                                {Object.entries(commission.client_fields)
                                    .filter(([, config]) => config.collect)
                                    .map(([field, config]) => (
                                        <div key={field}>
                                            <LabelText>
                                                {clientFieldLabel(field)}
                                                {config.required ? ' *' : ''}
                                            </LabelText>
                                            <Input
                                                type={field === 'email' ? 'email' : 'text'}
                                                value={clientDetails[field] ?? ''}
                                                onChange={(event) => {
                                                    setClientDetails((current) => ({
                                                        ...current,
                                                        [field]: event.target.value,
                                                    }))
                                                    setRequestErrors((current) => {
                                                        const next = { ...current }
                                                        delete next[`client_${field}`]
                                                        return next
                                                    })
                                                }}
                                                placeholder={clientFieldPlaceholder(field)}
                                                className="mt-1"
                                            />
                                            {requestErrors[`client_${field}`] && (
                                                <p className="mt-1 text-xs text-destructive">
                                                    {requestErrors[`client_${field}`]}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                        <div>
                            <LabelText>Reference notes</LabelText>
                            <textarea
                                value={referenceNotes}
                                onChange={(event) => {
                                    setReferenceNotes(event.target.value)
                                    setRequestErrors((current) => {
                                        const next = { ...current }
                                        delete next.reference_notes
                                        return next
                                    })
                                }}
                                className="mt-1 min-h-20 w-full rounded-md border bg-background p-3 text-sm"
                                placeholder="Paste links or describe extra references."
                            />
                            {requestErrors.reference_notes && (
                                <p className="mt-1 text-xs text-destructive">
                                    {requestErrors.reference_notes}
                                </p>
                            )}
                        </div>
                        <div>
                            <LabelText>Reference image</LabelText>
                            {referenceImage && (
                                <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                                    <span className="truncate">{referenceImage.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setReferenceImage(null)}
                                        className="shrink-0 font-medium text-foreground"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground transition hover:bg-muted/60 hover:text-foreground">
                                <ImagePlus className="h-4 w-4" />
                                <span>
                                    {referenceImage ? 'Replace image' : 'Upload reference image'}
                                </span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="sr-only"
                                    onChange={attachReferenceImage}
                                />
                            </label>
                            <p className="mt-1 text-xs text-muted-foreground">
                                JPG, PNG, WEBP, or GIF up to 10 MB.
                            </p>
                            {requestErrors.reference_image && (
                                <p className="mt-1 text-xs text-destructive">
                                    {requestErrors.reference_image}
                                </p>
                            )}
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="mb-2 text-sm font-semibold">Flow preview</p>
                            <FlowPreview flow={commission.flow} />
                        </div>
                        <RequestTermsPreview
                            commission={commission}
                            onExpand={() => setTermsOpen(true)}
                        />
                        <label
                            className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition ${agree ? 'border-foreground bg-muted/30' : 'bg-background'}`}
                        >
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(event) => {
                                    setAgree(event.target.checked)
                                    setRequestErrors((current) => {
                                        const next = { ...current }
                                        delete next.agree_to_flow
                                        return next
                                    })
                                }}
                                className="h-5 w-5 rounded"
                            />
                            <span className="font-medium">
                                I accept {commission.artist?.name ?? 'the artist'}'s Terms of
                                Service
                            </span>
                        </label>
                        {requestErrors.agree_to_flow && (
                            <p className="text-xs text-destructive">
                                {requestErrors.agree_to_flow}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            className="h-11 flex-1 rounded-full"
                            disabled={
                                requestMutation.isPending ||
                                requestMessage.trim().length < 10 ||
                                !agree
                            }
                            onClick={() => requestMutation.mutate()}
                        >
                            {requestMutation.isPending
                                ? 'Sending...'
                                : agree
                                  ? 'Send request'
                                  : 'Accept terms to start request'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
                <DialogContent className="flex max-h-[88dvh] flex-col overflow-hidden sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {commission.artist?.name ?? 'Artist'} Terms of Service
                        </DialogTitle>
                        <DialogDescription>
                            Review the artist, service, and platform terms before sending a request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 overflow-y-auto pr-2">
                        <CommissionTermsContent commission={commission} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function LabelText({ children }: { children: ReactNode }) {
    return <div className="text-sm font-medium">{children}</div>
}

function RequestQuestionInput({
    question,
    value,
    error,
    onChange,
}: {
    question: CommissionService['request_questions'][number]
    value: string
    error?: string
    onChange: (value: string) => void
}) {
    return (
        <div>
            <LabelText>
                {question.title}
                {question.required ? ' *' : ''}
            </LabelText>
            {question.description && (
                <p className="mt-1 text-xs text-muted-foreground">{question.description}</p>
            )}
            {question.id === 'license-use' ? (
                <div className="mt-2 space-y-2">
                    {(question.options ?? []).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onChange(option)}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                                value === option
                                    ? 'border-foreground bg-muted/60'
                                    : 'bg-background hover:bg-muted/40'
                            }`}
                        >
                            <span className="block font-medium">{licenseOptionTitle(option)}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                {licenseOptionDescription(option)}
                            </span>
                        </button>
                    ))}
                </div>
            ) : question.type === 'multiple_choice' || question.type === 'single_choice' ? (
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                    <option value="">Choose one</option>
                    {(question.options ?? []).map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : question.type === 'checkbox' ? (
                <div className="mt-2 space-y-2">
                    {(question.options ?? []).map((option) => {
                        const selected = value.split('\n').filter(Boolean)
                        const checked = selected.includes(option)
                        return (
                            <label
                                key={option}
                                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => {
                                        const next = event.target.checked
                                            ? [...selected, option]
                                            : selected.filter((item) => item !== option)
                                        onChange(next.join('\n'))
                                    }}
                                    className="h-4 w-4"
                                />
                                <span>{option}</span>
                            </label>
                        )
                    })}
                </div>
            ) : question.type === 'date' ? (
                <Input
                    type="date"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="mt-2"
                />
            ) : question.type === 'short_text' ? (
                <Input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="mt-2"
                />
            ) : (
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="mt-2 min-h-20 w-full rounded-md border bg-background p-3 text-sm"
                />
            )}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
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

function hasCollectedClientFields(fields: CommissionService['client_fields']) {
    return Object.values(fields ?? {}).some((config) => config.collect)
}

function clientFieldLabel(field: string) {
    return (
        (
            {
                name: 'Name',
                nickname: 'Nickname',
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

function clientFieldPlaceholder(field: string) {
    return (
        (
            {
                name: 'Name or nickname',
                nickname: 'Display nickname',
                email: 'you@example.com',
                discord: 'Discord username or link',
                twitter: 'https://x.com/username',
                instagram: 'https://instagram.com/username',
                facebook: 'https://facebook.com/username',
                tiktok: 'https://tiktok.com/@username',
            } as Record<string, string>
        )[field] ?? ''
    )
}

function profileClientDetails(user: User): Record<string, string> {
    return {
        name: user.name ?? '',
        nickname: user.nickname ?? '',
        email: user.email ?? '',
        discord: user.discord_url ?? '',
        twitter: user.twitter_url ?? '',
        instagram: user.instagram_url ?? '',
        facebook: '',
        tiktok: user.tiktok_url ?? '',
    }
}

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="rounded-lg border bg-background p-3">
            <Icon className="mb-2 h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
    )
}

function SectionTitle({ children }: { children: ReactNode }) {
    return <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest">{children}</h3>
}

function FlowPreview({ flow }: { flow: CommissionFlowStep[] }) {
    return (
        <div className="space-y-2">
            {flow.map((step, index) => (
                <div key={`${step.label}-${index}`} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2">
                        <p className="text-sm font-medium">{step.label}</p>
                        {typeof step.percent === 'number' && (
                            <p className="text-xs text-muted-foreground">
                                {step.percent}% of quote
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

function RequestTermsPreview({
    commission,
    onExpand,
}: {
    commission: CommissionService
    onExpand: () => void
}) {
    return (
        <div className="overflow-hidden rounded-xl border bg-background">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                    <p className="text-sm font-semibold">Terms of Service</p>
                    <p className="text-xs text-muted-foreground">
                        Please review before sending your request.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={onExpand}
                >
                    <Maximize2 className="h-4 w-4" />
                    <span className="sr-only">Open full terms</span>
                </Button>
            </div>
            <div className="max-h-72 overflow-y-auto px-4 py-3">
                <CommissionTermsContent commission={commission} compact />
            </div>
        </div>
    )
}

function CommissionTermsContent({
    commission,
    compact = false,
}: {
    commission: CommissionService
    compact?: boolean
}) {
    const hasTextTerms = Boolean(
        commission.quote_rules ||
        commission.required_references ||
        commission.refund_policy ||
        commission.terms ||
        commission.artist_terms
    )

    return (
        <div className={compact ? 'space-y-4' : 'space-y-5'}>
            {commission.quote_rules && (
                <TermSection title="Quote Rules" text={commission.quote_rules} />
            )}
            {commission.required_references && (
                <TermSection title="Required References" text={commission.required_references} />
            )}
            {commission.refund_policy && (
                <TermSection title="Refunds" text={commission.refund_policy} />
            )}
            {commission.terms && <TermSection title="Service Terms" text={commission.terms} />}
            {commission.artist_terms && (
                <TermSection title="Artist Terms" text={commission.artist_terms} />
            )}
            {!hasTextTerms && (
                <p className="text-sm text-muted-foreground">
                    The artist has not added extra service terms yet.
                </p>
            )}
            <div>
                <h4 className="text-sm font-bold uppercase tracking-wide">Platform Terms</h4>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                    {commission.platform_terms.map((term) => (
                        <li key={term} className="flex gap-2">
                            <span>•</span>
                            <span>{term}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

function TermSection({ title, text }: { title: string; text: string }) {
    return (
        <section>
            <h4 className="text-sm font-bold uppercase tracking-wide">{title}</h4>
            <div className="mt-2">
                <FormattedTermText text={text} />
            </div>
        </section>
    )
}

function isValidReferenceImage(file: File) {
    return REFERENCE_IMAGE_TYPES.includes(file.type) && file.size <= REFERENCE_IMAGE_MAX_BYTES
}

function flattenValidationErrors(errors: unknown) {
    if (!errors || typeof errors !== 'object') return {}

    return Object.entries(errors as Record<string, unknown>).reduce<Record<string, string>>(
        (result, [key, value]) => {
            if (Array.isArray(value)) {
                result[key] = String(value[0] ?? '')
            } else if (typeof value === 'string') {
                result[key] = value
            }

            return result
        },
        {}
    )
}

function TermBlock({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-lg border bg-background p-3">
            <p className="mb-1 text-sm font-semibold">{title}</p>
            <FormattedTermText text={text} />
        </div>
    )
}

function FormattedTermText({ text }: { text: string }) {
    const lines = text.split(/\r?\n/)

    return (
        <div className="space-y-1 text-sm leading-6 text-muted-foreground">
            {lines.map((line, index) => {
                const trimmed = line.trim()
                if (!trimmed) return <div key={index} className="h-2" />
                if (trimmed.startsWith('## ')) {
                    return (
                        <h4 key={index} className="pt-1 text-base font-semibold text-foreground">
                            {renderBoldText(trimmed.slice(3))}
                        </h4>
                    )
                }
                if (trimmed.startsWith('- ')) {
                    return (
                        <div key={index} className="flex gap-2">
                            <span>•</span>
                            <span>{renderBoldText(trimmed.slice(2))}</span>
                        </div>
                    )
                }
                return <p key={index}>{renderBoldText(line)}</p>
            })}
        </div>
    )
}

function renderBoldText(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={index} className="font-semibold text-foreground">
                    {part.slice(2, -2)}
                </strong>
            )
        }
        return <span key={index}>{part}</span>
    })
}

function RatingsList({ ratings }: { ratings: CommissionRating[] }) {
    if (ratings.length === 0) {
        return <p className="text-sm text-muted-foreground">No public ratings yet.</p>
    }

    return (
        <div className="space-y-3">
            {ratings.map((rating) => (
                <div key={rating.id} className="rounded-lg border bg-background p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            {rating.customer?.avatar ? (
                                <img
                                    src={storageUrl(rating.customer.avatar)!}
                                    alt={rating.customer.name}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                    {rating.customer?.name[0]?.toUpperCase() ?? 'W'}
                                </span>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {rating.customer?.name ?? 'Wanderer'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(rating.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {rating.rating}
                        </div>
                    </div>
                    {rating.comment && (
                        <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                            {rating.comment}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}
