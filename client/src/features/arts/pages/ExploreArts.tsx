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
    arts: {
        data: Art[]
    }
}

export default function ExploreArts() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('q') ?? '')
    const [selectedArt, setSelectedArt] = useState<Art | null>(null)
    const activeLabel = searchParams.get('label') ?? ''

    const params = useMemo(() => {
        const next = new URLSearchParams()
        if (searchParams.get('q')) next.set('q', searchParams.get('q')!)
        if (activeLabel) next.set('label', activeLabel)
        return next
    }, [activeLabel, searchParams])

    const { data, isLoading } = useQuery<ArtsResponse>({
        queryKey: ['public-arts', params.toString()],
        queryFn: () => publicApi.getArts(params).then((res) => res.data),
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

    return (
        <div className="mx-auto max-w-[1360px] px-4 py-8">
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

            {artists.length > 0 && (
                <section className="mb-8 rounded-lg border bg-background/80 p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-widest">
                            Featured Artists
                        </h2>
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
                                        <p className="truncate text-xs text-muted-foreground">
                                            @{artist.username}
                                        </p>
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
            )}

            {tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <button
                            key={tag.label}
                            type="button"
                            onClick={() => setLabel(tag.label)}
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
            )}

            {isLoading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 15 }).map((_, index) => (
                        <div key={index} className="h-64 animate-pulse rounded-lg bg-muted" />
                    ))}
                </div>
            ) : arts.length === 0 ? (
                <div className="rounded-lg border py-16 text-center">
                    <ImageOff className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No arts found</p>
                </div>
            ) : (
                <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5">
                    {arts.map((art) => (
                        <ArtExploreCard
                            key={art.id}
                            art={art}
                            onOpen={setSelectedArt}
                        />
                    ))}
                </div>
            )}

            <ArtDetailDialog
                art={selectedArt}
                open={Boolean(selectedArt)}
                onOpenChange={(open) => {
                    if (!open) setSelectedArt(null)
                }}
                onLabelClick={(label) => {
                    setLabel(label)
                    setSelectedArt(null)
                }}
            />
        </div>
    )
}

function ArtExploreCard({
    art,
    onOpen,
}: {
    art: Art
    onOpen: (art: Art) => void
}) {
    const firstImage = art.images?.[0]?.image_path ?? art.image_path

    return (
        <article className="mb-4 break-inside-avoid">
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
                        className="w-full select-none object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                ) : (
                    <div className="flex aspect-square items-center justify-center">
                        <ImageOff className="h-6 w-6 text-muted-foreground" />
                    </div>
                )}
            </button>
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
    const imageScrollerRef = useRef<HTMLDivElement | null>(null)
    const queryClient = useQueryClient()
    const { token } = useAuthStore()
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

    useEffect(() => {
        setActiveIndex(0)
        setZoom(1)
        setIsPanning(false)
        setLiked(Boolean(art?.liked_by_me))
        setLikes(art?.likes ?? 0)
    }, [art?.id])

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
                            <Stat icon={Eye} label="Views" value={art.views} />
                            <Stat icon={MessageCircle} label="Comments" value={art.comments_count} />
                            <Stat icon={Gift} label="Super likes" value={art.super_likes_count} />
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
