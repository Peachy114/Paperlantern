import { useMemo, useState, type ChangeEvent, type ComponentType, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import {
    BadgeCheck,
    BriefcaseBusiness,
    CalendarClock,
    Coins,
    ImagePlus,
    ImageOff,
    Search,
    ShieldCheck,
    Star,
    Users,
} from 'lucide-react'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import { useAuthStore } from '@/store/authStore'
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
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'

const statusLabel: Record<CommissionService['status'], string> = {
    open: 'Open',
    waitlist: 'Waitlist',
    closed: 'Closed',
}

const statusClass: Record<CommissionService['status'], string> = {
    open: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    waitlist: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    closed: 'border-muted-foreground/30 bg-muted text-muted-foreground',
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
    const [search, setSearch] = useState(searchParams.get('q') ?? '')
    const [selectedCommission, setSelectedCommission] = useState<CommissionService | null>(null)

    const params = useMemo(() => {
        const next = new URLSearchParams()
        for (const key of ['q', 'category']) {
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
    const visibleWidgets = useMemo(() => {
        const widgets = (data?.layout.widgets ?? defaultCommissionWidgets).filter((widget) => widget.enabled)
        const hasCommissionGrid = widgets.some((widget) => widget.type === 'commission_grid' || widget.type === 'boosted_commissions')

        return hasCommissionGrid ? widgets : [...widgets, defaultCommissionWidgets[0]]
    }, [data?.layout.widgets])

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const next = new URLSearchParams(searchParams)
        if (search.trim()) next.set('q', search.trim())
        else next.delete('q')
        setSearchParams(next)
    }

    const setFilter = (key: 'category', value: string) => {
        const next = new URLSearchParams(searchParams)
        if (next.get(key) === value || value === '') next.delete(key)
        else next.set(key, value)
        setSearchParams(next)
    }

    return (
        <div className="relative mx-auto max-w-[1360px] px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Explore
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">Commission</h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Browse artist commission openings, waitlists, prices, terms, and public ratings.
                    </p>
                </div>

                <form onSubmit={submitSearch} className="flex w-full gap-2 md:w-96">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search artists or commission types"
                    />
                    <Button type="submit" size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            {categories.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    <FilterButton active={!activeCategory} onClick={() => setFilter('category', '')}>
                        All types
                    </FilterButton>
                    {categories.map((category) => (
                        <FilterButton
                            key={category.id}
                            active={activeCategory === category.slug}
                            onClick={() => setFilter('category', category.slug)}
                        >
                            {category.name}
                        </FilterButton>
                    ))}
                </div>
            )}

            {visibleWidgets.map((widget) => {
                if (widget.type === 'commission_grid' || widget.type === 'boosted_commissions') {
                    const items = widget.type === 'boosted_commissions'
                        ? commissions.filter((commission) => commission.boosted_until)
                        : commissions

                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <CommissionGrid
                                commissions={items}
                                isLoading={isLoading}
                                grid={widget.settings.grid ?? 'masonry'}
                                columns={widget.settings.columns}
                                infoLayout={widget.settings.info_layout ?? 'image_only'}
                                onOpen={setSelectedCommission}
                            />
                        </PageWidgetFrame>
                    )
                }

                return <CustomPageWidget key={widget.id} widget={widget} />
            })}

            <CommissionDialog
                commission={selectedCommission}
                open={Boolean(selectedCommission)}
                onOpenChange={(open) => {
                    if (!open) setSelectedCommission(null)
                }}
            />
        </div>
    )
}

function FilterButton({
    active,
    children,
    onClick,
}: {
    active: boolean
    children: ReactNode
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md border px-2.5 py-1 text-xs ${
                active
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
        >
            {children}
        </button>
    )
}

function CommissionGrid({
    commissions,
    isLoading,
    grid,
    columns,
    infoLayout = 'image_only',
    onOpen,
}: {
    commissions: CommissionService[]
    isLoading: boolean
    grid: string
    columns?: number
    infoLayout?: string
    onOpen: (commission: CommissionService) => void
}) {
    if (isLoading) {
        return (
            <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5">
                {Array.from({ length: 14 }).map((_, index) => (
                    <div key={index} className="mb-4 h-64 break-inside-avoid animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
        )
    }

    if (commissions.length === 0) {
        return (
            <div className="rounded-lg border py-16 text-center">
                <ImageOff className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No commissions are open yet</p>
            </div>
        )
    }

    if (grid === 'standard') {
        return (
            <div
                style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
                className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
                {commissions.map((commission) => (
                    <CommissionCard key={commission.id} commission={commission} onOpen={onOpen} square infoLayout={infoLayout} />
                ))}
            </div>
        )
    }

    if (grid === 'gallery') {
        return (
            <div
                style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
                {commissions.map((commission) => (
                    <CommissionCard key={commission.id} commission={commission} onOpen={onOpen} gallery infoLayout={infoLayout} />
                ))}
            </div>
        )
    }

    return (
        <div
            style={columns ? { columnCount: columns } : undefined}
            className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5"
        >
            {commissions.map((commission) => (
                <CommissionCard key={commission.id} commission={commission} onOpen={onOpen} infoLayout={infoLayout} />
            ))}
        </div>
    )
}

function CommissionCard({
    commission,
    onOpen,
    square = false,
    gallery = false,
    infoLayout = 'image_only',
}: {
    commission: CommissionService
    onOpen: (commission: CommissionService) => void
    square?: boolean
    gallery?: boolean
    infoLayout?: string
}) {
    const image = commission.image_path
    const imageClass = square
        ? 'aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]'
        : gallery
          ? 'aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]'
          : 'aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-[1.02]'

    const imageButton = (
        <button
            type="button"
            onClick={() => onOpen(commission)}
            onContextMenu={(event) => event.preventDefault()}
            className="group relative block w-full overflow-hidden rounded-lg bg-muted text-left shadow-sm outline-none ring-offset-background transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            {image ? (
                <img
                    src={storageUrl(image)!}
                    alt={commission.title}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    onContextMenu={(event) => event.preventDefault()}
                    className={imageClass}
                />
            ) : (
                <DefaultCommissionImage className={square ? 'aspect-square' : gallery ? 'aspect-video' : 'aspect-[3/4]'} />
            )}
        </button>
    )
    const titleNode = <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{commission.title}</h3>
    const descriptionNode = (
        <p className="line-clamp-1 min-h-4 text-xs text-muted-foreground">
            {commission.status} . {commission.delivery_days ?? 'Flexible'} days
        </p>
    )

    return (
        <article className={square || gallery ? '' : 'mb-4 break-inside-avoid'}>
            {infoLayout === 'image_only' && imageButton}
            {infoLayout === 'image_title' && <div className="flex h-full flex-col gap-2">{imageButton}{titleNode}</div>}
            {infoLayout === 'image_title_inline' && <div className="flex h-full items-center gap-3"><div className="w-20 shrink-0">{imageButton}</div><div className="min-w-0">{titleNode}</div></div>}
            {infoLayout === 'title_image' && <div className="flex h-full flex-col gap-2">{titleNode}{imageButton}</div>}
            {infoLayout === 'image_title_description' && <div className="flex h-full flex-col gap-2">{imageButton}{titleNode}{descriptionNode}</div>}
        </article>
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
    const { openLogin } = useModalStore()
    const [requestOpen, setRequestOpen] = useState(false)
    const [requestMessage, setRequestMessage] = useState('')
    const [referenceNotes, setReferenceNotes] = useState('')
    const [referenceImage, setReferenceImage] = useState<File | null>(null)
    const [agree, setAgree] = useState(false)
    const [requestErrors, setRequestErrors] = useState<Record<string, string>>({})
    const [creditNotice, setCreditNotice] = useState<{
        message: string
        balance: number
        required: number
    } | null>(null)
    const requestMutation = useMutation({
        mutationFn: () => {
            const identifier = commission?.slug
            if (!identifier) {
                throw new Error('This commission is missing a public link. Please refresh and try again.')
            }

            const trimmedMessage = requestMessage.trim()
            const trimmedNotes = referenceNotes.trim()
            if (trimmedMessage.length < 10) {
                setRequestErrors({ request_message: 'Please describe your commission request in at least 10 characters.' })
                throw new Error('Please complete the required fields.')
            }
            if (!agree) {
                setRequestErrors({ agree_to_flow: 'Please confirm the commission flow and terms.' })
                throw new Error('Please complete the required fields.')
            }
            if (referenceImage && !isValidReferenceImage(referenceImage)) {
                setRequestErrors({ reference_image: 'Upload a JPG, PNG, WEBP, or GIF up to 10 MB.' })
                throw new Error('Please choose a supported reference image.')
            }

            const payload = new FormData()
            payload.append('request_message', trimmedMessage)
            if (trimmedNotes) payload.append('reference_notes', trimmedNotes)
            payload.append('agree_to_flow', agree ? '1' : '0')
            if (referenceImage) payload.append('reference_image', referenceImage)
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
            setRequestErrors({})
            setCreditNotice(null)
            navigate(orderId ? `/messages?order=${orderId}` : '/messages')
        },
        onError: (error: any) => {
            const errors = flattenValidationErrors(error?.response?.data?.errors)
            if (Object.keys(errors).length > 0) {
                setRequestErrors(errors)
                toast.error(Object.values(errors)[0])
                return
            }

            if (error?.response?.status === 402 && error?.response?.data?.requires_top_up) {
                const balance = Number(error.response.data.balance ?? 0)
                const required = Number(error.response.data.required_credits ?? commission?.base_price_credits ?? 0)
                const message = error.response.data.message ?? 'Add credits first, then come back to request this commission.'

                setCreditNotice({ message, balance, required })
                toast.error(`You need ${Math.max(0, required - balance).toLocaleString()} more credits.`)
                return
            }

            toast.error(error?.response?.data?.message ?? error?.message ?? 'Could not request commission.')
        },
    })

    if (!commission) return null

    const image = commission.image_path
    const upfront = getUpfrontCredits(commission.flow, commission.base_price_credits)
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
        setCreditNotice(null)
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
                                        <Badge className={statusClass[commission.status]} variant="outline">
                                            {statusLabel[commission.status]}
                                        </Badge>
                                        {commission.category && (
                                            <Badge variant="secondary">{commission.category.name}</Badge>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">{commission.title}</h2>
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
                                                    {commission.artist.name[0]?.toUpperCase() ?? 'A'}
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
                                    value={commission.delivery_days ? `${commission.delivery_days} days` : 'Quote'}
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

                            <SectionTitle>Terms</SectionTitle>
                            <div className="space-y-3">
                                {commission.quote_rules && (
                                    <TermBlock title="Quote rules" text={commission.quote_rules} />
                                )}
                                {commission.required_references && (
                                    <TermBlock
                                        title="Required references"
                                        text={commission.required_references}
                                    />
                                )}
                                {commission.refund_policy && (
                                    <TermBlock title="Refund policy" text={commission.refund_policy} />
                                )}
                                {commission.terms && <TermBlock title="Service terms" text={commission.terms} />}
                                {commission.artist_terms && (
                                    <TermBlock title="Artist terms" text={commission.artist_terms} />
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
                                You will review the artist flow and quote before credits are charged.
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
                        You must have {commission.base_price_credits} credits available before requesting.
                        {upfront > 0 ? ` ${upfront} credits will be held in escrow now.` : ''}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {creditNotice && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                            <p className="font-semibold text-amber-800 dark:text-amber-200">
                                Not enough credits
                            </p>
                            <p className="mt-1 text-amber-800/90 dark:text-amber-100/90">
                                {creditNotice.message}
                            </p>
                            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                <div className="rounded-md bg-background/70 px-3 py-2">
                                    <span className="text-muted-foreground">Your credits</span>
                                    <p className="font-semibold">{creditNotice.balance.toLocaleString()}</p>
                                </div>
                                <div className="rounded-md bg-background/70 px-3 py-2">
                                    <span className="text-muted-foreground">Required credits</span>
                                    <p className="font-semibold">{creditNotice.required.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <Button asChild size="sm">
                                    <Link to="/credits">Top up credits</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                    <div>
                        <LabelText>Message to artist</LabelText>
                        <textarea
                            value={requestMessage}
                            onChange={(event) => {
                                setRequestMessage(event.target.value)
                                setCreditNotice(null)
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
                            <p className="mt-1 text-xs text-destructive">{requestErrors.request_message}</p>
                        )}
                    </div>
                    <div>
                        <LabelText>Reference notes</LabelText>
                        <textarea
                            value={referenceNotes}
                            onChange={(event) => {
                                setReferenceNotes(event.target.value)
                                setCreditNotice(null)
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
                            <p className="mt-1 text-xs text-destructive">{requestErrors.reference_notes}</p>
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
                            <span>{referenceImage ? 'Replace image' : 'Upload reference image'}</span>
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
                            <p className="mt-1 text-xs text-destructive">{requestErrors.reference_image}</p>
                        )}
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="mb-2 text-sm font-semibold">Flow preview</p>
                        <FlowPreview flow={commission.flow} />
                    </div>
                    <label className="flex items-start gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={agree}
                            onChange={(event) => {
                                setAgree(event.target.checked)
                                setCreditNotice(null)
                                setRequestErrors((current) => {
                                    const next = { ...current }
                                    delete next.agree_to_flow
                                    return next
                                })
                            }}
                            className="mt-1 h-4 w-4"
                        />
                        <span>
                            I understand the artist flow, admin terms, and that credits may be held in escrow.
                        </span>
                    </label>
                    {requestErrors.agree_to_flow && (
                        <p className="text-xs text-destructive">{requestErrors.agree_to_flow}</p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={requestMutation.isPending || requestMessage.trim().length < 10 || !agree}
                        onClick={() => requestMutation.mutate()}
                    >
                        {requestMutation.isPending ? 'Sending...' : 'Send request'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}

function LabelText({ children }: { children: ReactNode }) {
    return <div className="text-sm font-medium">{children}</div>
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
                            <p className="text-xs text-muted-foreground">{step.percent}% of quote</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

function getUpfrontCredits(flow: CommissionFlowStep[], quoteCredits: number) {
    const first = flow[0]
    if (!first || first.type !== 'pay') return 0
    return Math.ceil(quoteCredits * ((first.percent ?? 0) / 100))
}

function isValidReferenceImage(file: File) {
    return REFERENCE_IMAGE_TYPES.includes(file.type) && file.size <= REFERENCE_IMAGE_MAX_BYTES
}

function flattenValidationErrors(errors: unknown) {
    if (!errors || typeof errors !== 'object') return {}

    return Object.entries(errors as Record<string, unknown>).reduce<Record<string, string>>((result, [key, value]) => {
        if (Array.isArray(value)) {
            result[key] = String(value[0] ?? '')
        } else if (typeof value === 'string') {
            result[key] = value
        }

        return result
    }, {})
}

function TermBlock({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-lg border bg-background p-3">
            <p className="mb-1 text-sm font-semibold">{title}</p>
            <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{text}</p>
        </div>
    )
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
