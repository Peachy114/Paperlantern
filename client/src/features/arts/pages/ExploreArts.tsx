import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentType,
    type FormEvent,
    type PointerEvent,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Coins,
    Download,
    Eye,
    Gift,
    Heart,
    ImageOff,
    MessageCircle,
    Minus,
    Plus,
    Search,
    Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { publicApi } from '@/api/public'
import { getWalletBalance } from '@/api/wallet'
import { storageUrl } from '@/utils/storage'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import type { Art, ArtImage } from '@/types/art'
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
import CommentSection from '@/features/comments/components/CommentSection'
import SuperLikeButton from '@/features/comments/components/SuperLikeButton'
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import type { PageLayout, PageWidget } from '@/types/pageLayout'

interface TagCount {
    label: string
    artists_count: number
}

interface FeaturedArtist {
    id: string
    name: string
    username: string
    avatar: string | null
    artist_title: string | null
    boosted_until: string
}

interface ArtsResponse {
    featured_artists: FeaturedArtist[]
    tags: TagCount[]
    layout: PageLayout
    arts: {
        data: Art[]
    }
}

const defaultArtsWidgets: PageWidget[] = [
    {
        id: 'default-featured-artists',
        type: 'featured_artists',
        title: 'Featured Artists',
        enabled: true,
        settings: {},
        style: { transparent: true, border: false, radius: 0, padding: 0, margin: 0, z_index: 1 },
    },
    {
        id: 'default-labels',
        type: 'labels',
        title: 'Labels',
        enabled: true,
        settings: {},
        style: { transparent: true, border: false, radius: 0, padding: 0, margin: 0, z_index: 1 },
    },
    {
        id: 'default-arts-grid',
        type: 'arts_grid',
        title: 'Arts',
        enabled: true,
        settings: { grid: 'masonry' },
        style: { transparent: true, border: false, radius: 0, padding: 0, margin: 0, z_index: 1 },
    },
]

export default function ExploreArts() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('q') ?? '')
    const [selectedArt, setSelectedArt] = useState<Art | null>(null)
    const activeLabel = searchParams.get('label') ?? ''
    const activeSort = searchParams.get('sort') ?? ''
    const requestedArt = searchParams.get('art') ?? ''

    const params = useMemo(() => {
        const next = new URLSearchParams()
        if (searchParams.get('q')) next.set('q', searchParams.get('q')!)
        if (activeLabel) next.set('label', activeLabel)
        if (activeSort) next.set('sort', activeSort)
        return next
    }, [activeLabel, activeSort, searchParams])

    const { data, isLoading } = useQuery<ArtsResponse>({
        queryKey: ['public-arts', params.toString()],
        queryFn: () => publicApi.getArts(params).then((res) => res.data),
    })
    const requestedArtQuery = useQuery<Art>({
        queryKey: ['public-art', requestedArt],
        queryFn: () => publicApi.getArt(requestedArt).then((res) => res.data),
        enabled: Boolean(requestedArt && !selectedArt),
        retry: false,
    })

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const next = new URLSearchParams(searchParams)
        if (search.trim()) next.set('q', search.trim())
        else next.delete('q')
        setSearchParams(next)
    }

    const setLabel = (label: string) => {
        const next = new URLSearchParams(searchParams)
        if (activeLabel === label) next.delete('label')
        else next.set('label', label)
        setSearchParams(next)
    }

    const arts = data?.arts.data ?? []
    const tags = data?.tags ?? []
    const artists = data?.featured_artists ?? []
    const openArt = (art: Art) => {
        const next = new URLSearchParams(searchParams)
        next.set('art', art.slug || art.id)
        setSelectedArt(art)
        setSearchParams(next, { replace: true })
    }

    const closeArt = () => {
        const next = new URLSearchParams(searchParams)
        next.delete('art')
        setSelectedArt(null)
        setSearchParams(next, { replace: true })
    }

    const selectLabelFromModal = (label: string) => {
        const next = new URLSearchParams(searchParams)
        next.delete('art')
        if (activeLabel === label) next.delete('label')
        else next.set('label', label)
        setSelectedArt(null)
        setSearchParams(next, { replace: true })
    }

    useEffect(() => {
        if (!requestedArt || selectedArt) return
        const found = arts.find((art) => art.slug === requestedArt || art.id === requestedArt)
        if (found) {
            setSelectedArt(found)
            return
        }
        if (requestedArtQuery.data) setSelectedArt(requestedArtQuery.data)
    }, [arts, requestedArt, requestedArtQuery.data, selectedArt])

    return (
        <div className="relative mx-auto max-w-[1360px] px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Explore
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">Arts</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Browse art posts, discover labels, and find artists.
                    </p>
                </div>

                <form onSubmit={submitSearch} className="flex w-full gap-2 md:w-96">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search arts or labels"
                    />
                    <Button type="submit" size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            {(data?.layout.widgets ?? defaultArtsWidgets).filter((widget) => widget.enabled).map((widget) => {
                if (widget.type === 'featured_artists') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <FeaturedArtistsSection artists={artists} />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'content_tabs') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <ContentTabsWidget widget={widget} />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'labels') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <LabelsSection tags={tags} activeLabel={activeLabel} onSelect={setLabel} />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'arts_grid') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <ArtsGrid
                                arts={arts}
                                isLoading={isLoading}
                                grid={widget.settings.grid ?? 'masonry'}
                                columns={widget.settings.columns}
                                infoLayout={widget.settings.info_layout ?? 'image_only'}
                                onOpen={openArt}
                            />
                        </PageWidgetFrame>
                    )
                }

                return <CustomPageWidget key={widget.id} widget={widget} />
            })}

            <ArtDetailDialog
                art={selectedArt}
                open={Boolean(selectedArt)}
                onOpenChange={(open) => {
                    if (!open) closeArt()
                }}
                onLabelClick={selectLabelFromModal}
            />
        </div>
    )
}

function FeaturedArtistsSection({ artists }: { artists: FeaturedArtist[] }) {
    if (artists.length === 0) return null

    return (
        <section className="mb-8 rounded-lg border bg-background/80 p-4">
            <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">Featured Artists</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
                {artists.map((artist) => (
                    <Link
                        key={artist.id}
                        to={`/artists/${artist.username}`}
                        className="w-44 shrink-0 rounded-lg border bg-muted/20 p-3 hover:bg-muted/40"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-full bg-primary text-primary-foreground">
                                {artist.avatar ? (
                                    <img
                                        src={storageUrl(artist.avatar)!}
                                        alt={artist.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-sm font-bold">
                                        {artist.name[0]?.toUpperCase() ?? 'A'}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{artist.name}</p>
                                <p className="truncate text-xs text-muted-foreground">@{artist.username}</p>
                            </div>
                        </div>
                        {artist.artist_title && (
                            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                {artist.artist_title}
                            </p>
                        )}
                    </Link>
                ))}
            </div>
        </section>
    )
}

function LabelsSection({
    tags,
    activeLabel,
    onSelect,
}: {
    tags: TagCount[]
    activeLabel: string
    onSelect: (label: string) => void
}) {
    if (tags.length === 0) return null

    return (
        <div className="mb-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
                <button
                    key={tag.label}
                    type="button"
                    onClick={() => onSelect(tag.label)}
                    className={`rounded-md border px-2.5 py-1 text-xs ${
                        activeLabel === tag.label
                            ? 'bg-foreground text-background'
                            : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {tag.label} . {tag.artists_count} artists
                </button>
            ))}
        </div>
    )
}

function ArtsGrid({
    arts,
    isLoading,
    grid,
    columns,
    infoLayout = 'image_only',
    onOpen,
}: {
    arts: Art[]
    isLoading: boolean
    grid: string
    columns?: number
    infoLayout?: string
    onOpen: (art: Art) => void
}) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 15 }).map((_, index) => (
                    <div key={index} className="h-64 animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
        )
    }

    if (arts.length === 0) {
        return (
            <div className="rounded-lg border py-16 text-center">
                <ImageOff className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No arts found</p>
            </div>
        )
    }

    if (grid === 'standard') {
        return (
            <div
                style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
                className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
                {arts.map((art) => (
                    <ArtExploreCard key={art.id} art={art} onOpen={onOpen} square infoLayout={infoLayout} />
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
                {arts.map((art) => (
                    <ArtExploreCard key={art.id} art={art} onOpen={onOpen} gallery infoLayout={infoLayout} />
                ))}
            </div>
        )
    }

    return (
        <div
            style={columns ? { columnCount: columns } : undefined}
            className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5"
        >
            {arts.map((art) => (
                <ArtExploreCard key={art.id} art={art} onOpen={onOpen} infoLayout={infoLayout} />
            ))}
        </div>
    )
}

function ArtExploreCard({
    art,
    onOpen,
    square = false,
    gallery = false,
    infoLayout = 'image_only',
}: {
    art: Art
    onOpen: (art: Art) => void
    square?: boolean
    gallery?: boolean
    infoLayout?: string
}) {
    const firstImage = art.images?.[0]?.image_path ?? art.image_path
    const imageClass = square
        ? 'aspect-square w-full select-none object-cover transition duration-300 group-hover:scale-[1.02]'
        : gallery
          ? 'aspect-video w-full select-none object-cover transition duration-300 group-hover:scale-[1.02]'
          : 'aspect-[3/4] w-full select-none object-cover transition duration-300 group-hover:scale-[1.02]'

    const imageButton = (
        <button
            type="button"
            onClick={() => onOpen(art)}
            onContextMenu={(event) => event.preventDefault()}
            className="group relative block w-full overflow-hidden rounded-lg bg-muted text-left shadow-sm outline-none ring-offset-background transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            {firstImage ? (
                <img
                    src={storageUrl(firstImage)!}
                    alt={art.title}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    onContextMenu={(event) => event.preventDefault()}
                    className={imageClass}
                />
            ) : (
                <div className="flex aspect-square items-center justify-center">
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                </div>
            )}
        </button>
    )
    const titleNode = <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{art.title}</h3>
    const descriptionNode = <p className="line-clamp-1 min-h-4 text-xs text-muted-foreground">{art.labels?.join(', ')}</p>

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

function ArtDetailDialog({
    art,
    open,
    onOpenChange,
    onLabelClick,
}: {
    art: Art | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onLabelClick: (label: string) => void
}) {
    const [activeIndex, setActiveIndex] = useState(0)
    const [zoom, setZoom] = useState(1)
    const [isPanning, setIsPanning] = useState(false)
    const [liked, setLiked] = useState(false)
    const [likes, setLikes] = useState(0)
    const [views, setViews] = useState(0)
    const [downloadUnlocked, setDownloadUnlocked] = useState(false)
    const [downloadsCount, setDownloadsCount] = useState(0)
    const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false)
    const [downloadError, setDownloadError] = useState('')
    const recordedViewRef = useRef<string | null>(null)
    const imageScrollerRef = useRef<HTMLDivElement | null>(null)
    const queryClient = useQueryClient()
    const { token, user } = useAuthStore()
    const { openLogin } = useModalStore()
    const panRef = useRef({
        pointerId: -1,
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
    })
    const images = useMemo(() => (art ? getArtImages(art) : []), [art])
    const activeImage = images[activeIndex]
    const activeImageSrc = activeImage?.image_path ?? art?.image_path ?? null
    const isOwner = Boolean(art?.user?.id && user?.id === art.user.id)
    const walletQuery = useQuery({
        queryKey: ['wallet'],
        queryFn: getWalletBalance,
        enabled: Boolean(open && token && art?.download_policy === 'paid' && !downloadUnlocked),
        staleTime: 30_000,
    })

    useEffect(() => {
        setActiveIndex(0)
        setZoom(1)
        setDownloadConfirmOpen(false)
        setDownloadError('')
        setIsPanning(false)
        setLiked(Boolean(art?.liked_by_me))
        setLikes(art?.likes ?? 0)
        setViews(art?.views ?? 0)
        setDownloadUnlocked(Boolean(art?.download_unlocked))
        setDownloadsCount(art?.downloads_count ?? 0)
    }, [art?.id])

    useEffect(() => {
        if (!open) {
            recordedViewRef.current = null
            return
        }
        if (!art?.id) return
        if (recordedViewRef.current === art.id) return

        recordedViewRef.current = art.id
        publicApi.recordArtView(art.id)
            .then((res) => {
                setViews(res.data.views)
                queryClient.invalidateQueries({ queryKey: ['public-arts'] })
                queryClient.invalidateQueries({ queryKey: ['studio-arts'] })
            })
            .catch(() => {
                recordedViewRef.current = null
            })
    }, [art?.id, open, queryClient])

    const likeMutation = useMutation({
        mutationFn: () => publicApi.toggleArtLike(art!.id).then((res) => res.data),
        onSuccess: (result) => {
            setLiked(result.liked)
            setLikes(result.likes)
            queryClient.invalidateQueries({ queryKey: ['public-arts'] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not like this art.')
        },
    })

    const purchaseDownloadMutation = useMutation({
        mutationFn: () => publicApi.purchaseArtDownload(art!.id).then((res) => res.data),
        onSuccess: (result) => {
            setDownloadUnlocked(Boolean(result.unlocked))
            setDownloadError('')
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            queryClient.invalidateQueries({ queryKey: ['public-arts'] })
        },
        onError: (error: any) => {
            const message = error.response?.data?.message ?? 'Could not unlock this download.'
            setDownloadError(message)
            toast.error(message)
        },
    })

    const downloadOriginal = async () => {
        if (!art) return

        const activeImageId = art.images?.some((image) => image.id === activeImage?.id)
            ? activeImage?.id
            : undefined
        const response = await publicApi.downloadArt(art.id, activeImageId)
        saveDownloadBlob(response.data, responseFileName(response, downloadFileName(art, activeImage)))
        setDownloadUnlocked(true)
        setDownloadsCount((count) => count + 1)
        queryClient.invalidateQueries({ queryKey: ['public-arts'] })
        toast.success('Original art download started.')
    }

    const handleDownload = async () => {
        if (!art) return

        const policy = art.download_policy ?? 'disabled'
        if (policy === 'disabled') return
        if (isOwner) {
            toast.error('You cannot download your own art from the public page.')
            return
        }
        if (policy === 'paid' && !token) {
            toast.info(`This original download costs ${creditLabel(art.download_credits)}. Please sign in to continue.`)
            openLogin()
            return
        }
        if (policy === 'paid') {
            setDownloadConfirmOpen(true)
            return
        }

        try {
            await downloadOriginal()
        } catch (error: any) {
            const fallback = error.response?.status === 402
                ? `Unlock this download for ${art.download_credits} credits first.`
                : 'Could not download this art.'
            toast.error(error.response?.data?.message ?? fallback)
        }
    }

    const confirmPaidDownload = async () => {
        if (!art) return
        setDownloadError('')

        if (hasInsufficientCredits(art, downloadUnlocked, walletQuery.data?.balance)) {
            setDownloadError(
                `You need ${creditLabel(art.download_credits)} to buy this download. Top up credits first.`
            )
            return
        }

        try {
            if (!downloadUnlocked) {
                const result = await purchaseDownloadMutation.mutateAsync()
                if (!result.unlocked) return
                toast.success(result.message ?? 'Original art download unlocked.')
            }

            setDownloadConfirmOpen(false)
            try {
                await downloadOriginal()
            } catch (error: any) {
                toast.error(error.response?.data?.message ?? 'Could not download this art.')
            }
        } catch {
            // The mutation already shows the API error.
        }
    }

    useEffect(() => {
        const scroller = imageScrollerRef.current
        if (!scroller) return

        requestAnimationFrame(() => {
            scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2)
            scroller.scrollTop = Math.max(0, (scroller.scrollHeight - scroller.clientHeight) / 2)
        })
    }, [activeIndex, zoom])

    const beginImagePan = (event: PointerEvent<HTMLDivElement>) => {
        if (!activeImageSrc || event.button !== 0) return

        const scroller = imageScrollerRef.current
        if (!scroller) return

        panRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: scroller.scrollLeft,
            scrollTop: scroller.scrollTop,
        }
        setIsPanning(true)
        event.currentTarget.setPointerCapture(event.pointerId)
        event.preventDefault()
    }

    const moveImagePan = (event: PointerEvent<HTMLDivElement>) => {
        if (!isPanning || panRef.current.pointerId !== event.pointerId) return

        const scroller = imageScrollerRef.current
        if (!scroller) return

        scroller.scrollLeft = panRef.current.scrollLeft - (event.clientX - panRef.current.startX)
        scroller.scrollTop = panRef.current.scrollTop - (event.clientY - panRef.current.startY)
        event.preventDefault()
    }

    const endImagePan = (event: PointerEvent<HTMLDivElement>) => {
        if (panRef.current.pointerId !== event.pointerId) return

        setIsPanning(false)
        panRef.current.pointerId = -1
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    if (!art) return null

    const isAdmin = art.user?.role === 'super_admin'
    const insufficientCredits = hasInsufficientCredits(
        art,
        downloadUnlocked,
        walletQuery.data?.balance
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[96dvh] !w-[calc(100vw-0.75rem)] !max-w-none overflow-hidden p-0 sm:!max-w-none lg:!w-[min(99vw,1540px)]">
                <DialogHeader className="sr-only">
                    <DialogTitle>{art.title}</DialogTitle>
                    <DialogDescription>Art details</DialogDescription>
                </DialogHeader>

                <div className="grid h-full min-h-0 grid-rows-[minmax(280px,46dvh)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:grid-rows-1">
                    <aside className="order-2 min-h-0 overflow-y-auto bg-background p-4 sm:p-5 lg:order-2 lg:border-l">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-xl font-semibold leading-tight">{art.title}</h2>
                                {artDownloadPriceLabel(art) && (
                                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 text-xs font-semibold">
                                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                                        {artDownloadPriceLabel(art)}
                                    </div>
                                )}
                                <div className="mt-2">
                                    {isAdmin ? (
                                        <p className="text-sm text-muted-foreground">
                                            By <span className="font-medium text-foreground">Admin</span>
                                        </p>
                                    ) : art.user?.username ? (
                                        <Link
                                            to={`/artists/${art.user.username}`}
                                            className="text-sm font-medium hover:underline"
                                            onClick={() => onOpenChange(false)}
                                        >
                                            {art.user.name}
                                        </Link>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">By Unknown</p>
                                    )}
                                </div>
                            </div>
                            {art.boosted_until && (
                                <Badge className="shrink-0 bg-amber-500 text-black">
                                    <Sparkles className="h-3 w-3" />
                                    Boosted
                                </Badge>
                            )}
                        </div>

                        {isArtDownloadable(art) && (
                            <div className="mb-4 rounded-lg border bg-muted/20 p-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                            Original download
                                        </p>
                                        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                                            <Coins className="h-4 w-4 text-amber-500" />
                                            {artDownloadPriceLabel(art)}
                                        </p>
                                    </div>
                                    {!isOwner ? (
                                        <Button
                                            type="button"
                                            variant={art.download_policy === 'paid' ? 'default' : 'outline'}
                                            onClick={handleDownload}
                                            disabled={purchaseDownloadMutation.isPending}
                                            className="shrink-0"
                                        >
                                            <Download className="h-4 w-4" />
                                            {downloadButtonLabel(art, downloadUnlocked)}
                                        </Button>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            Public downloads are hidden for your own art.
                                        </p>
                                    )}
                                </div>
                                {downloadConfirmOpen && art.download_policy === 'paid' && !isOwner && (
                                    <div className="mt-3 rounded-lg border bg-background p-3">
                                        <p className="text-sm font-semibold">
                                            {downloadUnlocked
                                                ? 'Download original art?'
                                                : 'Buy original download?'}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            {downloadUnlocked
                                                ? 'You already purchased this paid art download. Confirm to download the clean original file.'
                                                : `This paid art download costs ${creditLabel(art.download_credits)}. Confirm before credits are deducted. After purchase, the clean original file will download.`}
                                        </p>
                                        <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-muted-foreground">
                                                    {downloadUnlocked ? 'Status' : 'Cost'}
                                                </span>
                                                <span className="font-semibold">
                                                    {downloadUnlocked
                                                        ? 'Purchased'
                                                        : creditLabel(art.download_credits)}
                                                </span>
                                            </div>
                                            {!downloadUnlocked && (
                                                <div className="mt-2 flex items-center justify-between gap-3">
                                                    <span className="text-muted-foreground">Your credits</span>
                                                    <span className="font-semibold">
                                                        {walletQuery.isLoading
                                                            ? 'Checking...'
                                                            : (walletQuery.data?.balance ?? 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {(downloadError || insufficientCredits) && (
                                            <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                                                <p className="font-medium">
                                                    {downloadError ||
                                                        `You need ${creditLabel(art.download_credits)} to buy this download.`}
                                                </p>
                                                <p className="mt-1 text-xs opacity-80">
                                                    Add credits first, then come back to buy the original file.
                                                </p>
                                            </div>
                                        )}
                                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setDownloadConfirmOpen(false)
                                                    setDownloadError('')
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            {insufficientCredits && (
                                                <Button asChild variant="outline">
                                                    <Link
                                                        to="/credits"
                                                        onClick={() => setDownloadConfirmOpen(false)}
                                                    >
                                                        Top up credits
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                onClick={confirmPaidDownload}
                                                disabled={purchaseDownloadMutation.isPending || insufficientCredits}
                                            >
                                                {purchaseDownloadMutation.isPending
                                                    ? 'Processing...'
                                                    : insufficientCredits
                                                      ? 'Not enough credits'
                                                      : downloadUnlocked
                                                        ? 'Confirm Download'
                                                        : 'Buy & Download'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant={liked ? 'secondary' : 'outline'}
                                onClick={() => {
                                    if (!token) {
                                        openLogin()
                                        return
                                    }
                                    likeMutation.mutate()
                                }}
                                disabled={likeMutation.isPending}
                            >
                                <Heart className={liked ? 'h-4 w-4 fill-current text-red-500' : 'h-4 w-4'} />
                                Like
                                <span className="text-xs text-muted-foreground">{likes.toLocaleString()}</span>
                            </Button>
                            <SuperLikeButton
                                targetType="art"
                                targetId={art.id}
                                initialCount={art.super_likes_count ?? 0}
                                ownerUserId={art.user?.id}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Stat icon={Heart} label="Likes" value={likes} />
                            <Stat icon={Eye} label="Views" value={views} />
                            <Stat icon={MessageCircle} label="Comments" value={art.comments_count} />
                            <Stat icon={Gift} label="Super likes" value={art.super_likes_count} />
                            {isArtDownloadable(art) && (
                                <Stat icon={Download} label="Downloads" value={downloadsCount} />
                            )}
                        </div>

                        <Separator className="my-5" />

                        {art.description ? (
                            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                {art.description}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">No description added.</p>
                        )}

                        {activeImage?.description && (
                            <div className="mt-4 rounded-lg border bg-muted/20 p-3">
                                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                    Image note
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {activeImage.description}
                                </p>
                            </div>
                        )}

                        {art.labels && art.labels.length > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                    Labels
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {art.labels.map((label) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => onLabelClick(label)}
                                            className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator className="my-5" />

                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Posted {formatDate(art.created_at)}
                        </p>

                        <div className="mt-6">
                            <CommentSection
                                targetType="art"
                                targetId={art.id}
                                artistUsername={isAdmin ? null : art.user?.username}
                                title="Art comments"
                                compact
                            />
                        </div>
                    </aside>

                    <div className="order-1 flex min-h-0 min-w-0 flex-col bg-zinc-950 lg:order-1">
                        <div className="relative min-h-0 flex-1 overflow-hidden">
                            <div
                                ref={imageScrollerRef}
                                className={`absolute inset-0 overflow-auto p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:p-5 ${
                                    activeImageSrc
                                        ? isPanning
                                            ? 'cursor-grabbing'
                                            : 'cursor-grab'
                                        : ''
                                }`}
                                onContextMenu={(event) => event.preventDefault()}
                                onPointerDown={beginImagePan}
                                onPointerMove={moveImagePan}
                                onPointerUp={endImagePan}
                                onPointerCancel={endImagePan}
                                onPointerLeave={endImagePan}
                            >
                                {activeImageSrc ? (
                                    <div
                                        className="flex min-h-full min-w-full items-center justify-center"
                                        style={{
                                            width: zoom > 1 ? `${zoom * 100}%` : '100%',
                                            height: zoom > 1 ? `${zoom * 100}%` : '100%',
                                        }}
                                    >
                                        <img
                                            src={storageUrl(activeImageSrc)!}
                                            alt={activeImage?.description ?? art.title}
                                            draggable={false}
                                            onDragStart={(event) => event.preventDefault()}
                                            onContextMenu={(event) => event.preventDefault()}
                                            className="block max-h-full max-w-full select-none object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-400">
                                        <ImageOff className="h-8 w-8 text-zinc-500" />
                                        <p className="text-sm">No image available</p>
                                    </div>
                                )}
                            </div>

                            {images.length > 1 && (
                                <>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                                        onClick={() =>
                                            setActiveIndex((index) =>
                                                index === 0 ? images.length - 1 : index - 1
                                            )
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
                                        onClick={() =>
                                            setActiveIndex((index) =>
                                                index === images.length - 1 ? 0 : index + 1
                                            )
                                        }
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </>
                            )}

                            {activeImageSrc && (
                                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/60 p-1 text-white">
                                    <Button
                                        type="button"
                                        size="icon-sm"
                                        variant="ghost"
                                        className="text-white hover:bg-white/15 hover:text-white"
                                        onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
                                        title="Zoom out"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-12 text-center text-xs">
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <Button
                                        type="button"
                                        size="icon-sm"
                                        variant="ghost"
                                        className="text-white hover:bg-white/15 hover:text-white"
                                        onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
                                        title="Zoom in"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto border-t border-white/10 p-3">
                                {images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        type="button"
                                        onClick={() => setActiveIndex(index)}
                                        className={`h-16 w-16 shrink-0 overflow-hidden rounded bg-white/10 ${
                                            index === activeIndex
                                                ? 'ring-2 ring-white'
                                                : 'opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={storageUrl(image.image_path)!}
                                            alt={image.description ?? art.title}
                                            draggable={false}
                                            onDragStart={(event) => event.preventDefault()}
                                            onContextMenu={(event) => event.preventDefault()}
                                            className="h-full w-full select-none object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Stat({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>
    label: string
    value: number
}) {
    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{label}</span>
            </div>
            <p className="mt-1 text-sm font-semibold">{value.toLocaleString()}</p>
        </div>
    )
}

function getArtImages(art: Art): ArtImage[] {
    const validImages = art.images?.filter((image) => Boolean(image.image_path)) ?? []
    if (validImages.length > 0) return validImages

    if (art.image_path) {
        return [
            {
                id: `${art.id}-main`,
                art_id: art.id,
                image_path: art.image_path,
                description: null,
                sort_order: 0,
                created_at: art.created_at,
                updated_at: art.updated_at,
            },
        ]
    }

    return []
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(new Date(value))
}

function downloadButtonLabel(art: Art, unlocked: boolean) {
    if (art.download_policy === 'paid' && !unlocked) {
        return `Buy for ${creditLabel(art.download_credits)}`
    }

    if (art.download_policy === 'paid' && unlocked) {
        return 'Download purchased original'
    }

    return 'Download original'
}

function isArtDownloadable(art: Art) {
    return art.download_policy === 'free' || art.download_policy === 'paid'
}

function artDownloadPriceLabel(art: Art) {
    if (art.download_policy === 'paid') {
        return `${creditLabel(art.download_credits)} download`
    }

    if (art.download_policy === 'free') {
        return 'Free download'
    }

    return ''
}

function creditLabel(value: number) {
    const credits = Math.max(1, Number(value) || 1)
    return `${credits.toLocaleString()} credit${credits === 1 ? '' : 's'}`
}

function hasInsufficientCredits(art: Art, unlocked: boolean, balance?: number) {
    if (art.download_policy !== 'paid' || unlocked || balance === undefined) {
        return false
    }

    return balance < Math.max(1, Number(art.download_credits) || 1)
}

function downloadFileName(art: Art, image?: ArtImage) {
    const suffix = image?.id ? `-${image.id.slice(0, 8)}` : ''
    const extension = image?.image_path?.split('.').pop()?.split('?')[0] || 'jpg'
    return `${slugify(art.title || 'later-n-comix-art')}${suffix}.${extension}`
}

function responseFileName(response: any, fallback: string) {
    const disposition = response?.headers?.['content-disposition'] as string | undefined
    const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
    if (!match?.[1]) return fallback

    try {
        return decodeURIComponent(match[1].replace(/"/g, ''))
    } catch {
        return match[1].replace(/"/g, '') || fallback
    }
}

function saveDownloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'later-n-comix-art'
}
