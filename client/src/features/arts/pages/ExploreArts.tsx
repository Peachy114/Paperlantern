import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Heart,
    ImageOff,
    MessageCircle,
    Minus,
    Plus,
    Share2,
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
import { Separator } from '@/components/ui/separator'
import CommentSection from '@/features/comments/components/CommentSection'
import SuperLikeButton from '@/features/comments/components/SuperLikeButton'
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'
import ContentTabsWidget from '@/features/page-builder/ContentTabsWidget'
import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import LabelRailWidget from '@/features/page-builder/LabelRailWidget'
import {
    gridContinuationOffset,
    labelContinuationOffset,
} from '@/features/page-builder/continuation'
import SharedDiscoveryWidget, {
    isSharedDiscoveryWidget,
} from '@/features/page-builder/SharedDiscoveryWidget'
import type { WorkItem } from '@/features/work/hooks/useHome'
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

    const setLabel = (label: string) => {
        const next = new URLSearchParams(searchParams)
        if (activeLabel === label) next.delete('label')
        else next.set('label', label)
        setSearchParams(next)
    }

    const apiArts = data?.arts.data ?? []
    const arts = apiArts
    const widgetArts = (widget: PageWidget) => applyArtWidgetFilters(arts, widget)
    const heroWorks = (items: Art[]) => items.map(artToWork)
    const tags = data?.tags ?? []
    const artists = data?.featured_artists ?? []
    const pageWidgets = (data?.layout.widgets ?? defaultArtsWidgets).filter(
        (widget) => widget.enabled
    )
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
        <div className="relative mx-auto max-w-[1480px] px-4 py-8">
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

                {/* i dont need search in herer at that moments */}
                {/* <form onSubmit={submitSearch} className="flex w-full gap-2 md:w-96">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search arts or labels"
                    />
                    <Button type="submit" size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                </form> */}
            </div>

            {pageWidgets.map((widget) => {
                const limit = widget.settings.limit ?? 10
                const gridOffset = gridContinuationOffset(pageWidgets, widget)
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

                if (widget.type === 'featured_hero') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <FeaturedHeroWidget
                                widget={widget}
                                works={heroWorks(widgetArts(widget)).slice(
                                    0,
                                    widget.settings.limit ?? 10
                                )}
                            />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'group_hero') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <GroupHeroWidget
                                widget={widget}
                                works={heroWorks(widgetArts(widget)).slice(
                                    0,
                                    widget.settings.limit ?? 10
                                )}
                            />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'labels') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <LabelRailWidget
                                widget={widget}
                                labels={tags.map((tag) => ({
                                    label: tag.label,
                                    count: tag.artists_count,
                                }))}
                                activeLabel={activeLabel}
                                onSelect={setLabel}
                                offset={labelContinuationOffset(pageWidgets, widget)}
                            />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'arts_grid' || widget.type === 'grid_con') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <ArtsGrid
                                arts={widgetArts(widget).slice(gridOffset, gridOffset + limit)}
                                isLoading={isLoading}
                                grid={widget.settings.grid ?? 'masonry'}
                                columns={widget.settings.columns}
                                infoLayout={widget.settings.info_layout ?? 'image_only'}
                                onOpen={openArt}
                            />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'shop_card') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <ShopCardWidget widget={widget} />
                        </PageWidgetFrame>
                    )
                }

                if (isSharedDiscoveryWidget(widget.type)) {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <SharedDiscoveryWidget widget={widget} widgets={pageWidgets} />
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

function applyArtWidgetFilters(arts: Art[], widget: PageWidget) {
    const settings = widget.settings ?? {}
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = (settings.label_filter_values ?? [])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()

    const filtered = arts.filter((art) => {
        if (!matchesDateWindow(art.created_at, widget)) return false
        const matches = (source: string, value: string) => {
            if (!value || source === 'none') return true
            if (source === 'status') return String(art.status ?? '').toLowerCase() === value
            if (source === 'genre' || source === 'label') {
                return (art.labels ?? []).some((label) => label.toLowerCase() === value)
            }
            return source !== 'commission_type'
        }
        const multiOk =
            multiSource === 'none' || multiValues.length === 0
                ? true
                : multiValues.some((value) => matches(multiSource, value))
        const badgeOk =
            badgeSource === 'none' || !badgeValue ? true : matches(badgeSource, badgeValue)
        return multiOk && badgeOk
    })

    return sortArts(filtered, widget)
}

function sortArts(arts: Art[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...arts].sort((a, b) => {
        for (const sort of sorts) {
            const value = compareArtSort(a, b, sort)
            if (value !== 0) return value
        }

        return 0
    })
}

function compareArtSort(a: Art, b: Art, sort: string) {
    if (sort === 'featured') return Number(b.is_featured) - Number(a.is_featured)
    if (sort === 'likes') return (b.likes ?? 0) - (a.likes ?? 0)
    if (sort === 'views' || sort === 'popular') return (b.views ?? 0) - (a.views ?? 0)
    if (sort === 'new' || sort === 'latest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    }
    return 0
}

function matchesDateWindow(value: string | undefined, widget: PageWidget) {
    const mode = widget.settings.date_mode ?? 'all'
    const dateValue = widget.settings.date_value || widget.settings.daily_date
    if (mode === 'all' || !value) return true

    const date = new Date(value)
    const base = dateValue ? new Date(dateValue) : new Date()
    if (Number.isNaN(date.getTime()) || Number.isNaN(base.getTime())) return true

    if (mode === 'daily') return date.toISOString().slice(0, 10) === base.toISOString().slice(0, 10)
    if (mode === 'weekly')
        return Math.abs(date.getTime() - base.getTime()) <= 7 * 24 * 60 * 60 * 1000
    if (mode === 'monthly') {
        return (
            date.getUTCFullYear() === base.getUTCFullYear() &&
            date.getUTCMonth() === base.getUTCMonth()
        )
    }

    return true
}

function artToWork(art: Art): WorkItem {
    const image = art.images?.[0]?.image_path ?? art.image_path ?? null
    return {
        id: art.id,
        slug: art.slug,
        title: art.title,
        cover: image,
        banner: image,
        description: art.description ?? '',
        type: 'art',
        content_type: 'art',
        genres: art.labels ?? [],
        views: art.views ?? 0,
        likes: art.likes ?? 0,
        created_at: art.created_at,
        status: art.status === 'archived' ? 'draft' : art.status,
        is_featured: Boolean(art.is_featured),
    }
}

function FeaturedArtistsSection({ artists }: { artists: FeaturedArtist[] }) {
    if (artists.length === 0) return null

    return (
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
                style={
                    columns
                        ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
                {arts.map((art) => (
                    <ArtExploreCard
                        key={art.id}
                        art={art}
                        onOpen={onOpen}
                        square
                        infoLayout={infoLayout}
                    />
                ))}
            </div>
        )
    }

    if (grid === 'gallery') {
        return (
            <div
                style={
                    columns
                        ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
                {arts.map((art) => (
                    <ArtExploreCard
                        key={art.id}
                        art={art}
                        onOpen={onOpen}
                        gallery
                        infoLayout={infoLayout}
                    />
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
    const titleNode = (
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{art.title}</h3>
    )
    const descriptionNode = (
        <p className="line-clamp-1 min-h-4 text-xs text-muted-foreground">
            {art.labels?.join(', ')}
        </p>
    )

    return (
        <article className={square || gallery ? '' : 'mb-4 break-inside-avoid'}>
            {infoLayout === 'image_only' && imageButton}
            {infoLayout === 'image_title' && (
                <div className="flex h-full flex-col gap-2">
                    {imageButton}
                    {titleNode}
                </div>
            )}
            {infoLayout === 'image_title_inline' && (
                <div className="flex h-full items-center gap-3">
                    <div className="w-20 shrink-0">{imageButton}</div>
                    <div className="min-w-0">{titleNode}</div>
                </div>
            )}
            {infoLayout === 'title_image' && (
                <div className="flex h-full flex-col gap-2">
                    {titleNode}
                    {imageButton}
                </div>
            )}
            {infoLayout === 'image_title_description' && (
                <div className="flex h-full flex-col gap-2">
                    {imageButton}
                    {titleNode}
                    {descriptionNode}
                </div>
            )}
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
    const recordedViewRef = useRef<string | null>(null)
    const imageScrollerRef = useRef<HTMLDivElement | null>(null)
    const commentsSectionRef = useRef<HTMLDivElement | null>(null)
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

    useEffect(() => {
        if (!open) {
            recordedViewRef.current = null
            return
        }
        if (!art?.id) return
        if (recordedViewRef.current === art.id) return

        recordedViewRef.current = art.id
        publicApi
            .recordArtView(art.id)
            .then(() => {
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
    const artistName = isAdmin ? 'Admin' : (art.user?.name ?? 'Unknown')
    const artistUsername = isAdmin ? null : (art.user?.username ?? null)
    const artistAvatar = (art.user as { avatar?: string | null } | null | undefined)?.avatar ?? null
    const artistInitial = artistName.trim().charAt(0).toUpperCase() || 'A'
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[96dvh] !w-[calc(100vw-0.75rem)] !max-w-none overflow-hidden p-0 sm:!max-w-none lg:!w-[min(99vw,1540px)]">
                <DialogHeader className="sr-only">
                    <DialogTitle>{art.title}</DialogTitle>
                    <DialogDescription>Art details</DialogDescription>
                </DialogHeader>

                <div className="grid h-full min-h-0 grid-rows-[minmax(280px,46dvh)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:grid-rows-1">
                    <aside className="order-2 min-h-0 overflow-y-auto bg-background p-4 sm:p-5 lg:order-2 lg:border-l">
                        {/* ==================== CREATOR: AVATAR + NAME ==================== */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                {artistUsername ? (
                                    <Link
                                        to={`/artists/${artistUsername}`}
                                        onClick={() => onOpenChange(false)}
                                        className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground ring-1 ring-border"
                                        aria-label={`Open ${artistName}'s profile`}
                                    >
                                        {artistAvatar ? (
                                            <img
                                                src={storageUrl(artistAvatar)!}
                                                alt={artistName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-sm font-bold">
                                                {artistInitial}
                                            </span>
                                        )}
                                    </Link>
                                ) : (
                                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground ring-1 ring-border">
                                        {artistAvatar ? (
                                            <img
                                                src={storageUrl(artistAvatar)!}
                                                alt={artistName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-sm font-bold">
                                                {artistInitial}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="min-w-0">
                                    {artistUsername ? (
                                        <Link
                                            to={`/artists/${artistUsername}`}
                                            onClick={() => onOpenChange(false)}
                                            className="block truncate text-sm font-semibold hover:underline"
                                        >
                                            {artistName}
                                        </Link>
                                    ) : (
                                        <p className="truncate text-sm font-semibold">
                                            {artistName}
                                        </p>
                                    )}

                                    {artistUsername && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            @{artistUsername}
                                        </p>
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

                        <Separator className="my-5" />

                        {/* ==================== DESCRIPTION ==================== */}
                        <section aria-labelledby="art-description-heading">
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                Description
                            </p>
                            <h2
                                id="art-description-heading"
                                className="mt-2 text-lg font-semibold leading-tight"
                            >
                                {art.title}
                            </h2>

                            {art.description ? (
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                    {art.description}
                                </p>
                            ) : (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    No description added.
                                </p>
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
                        </section>

                        {/* ==================== LABELS ==================== */}
                        <section className="mt-5" aria-labelledby="art-labels-heading">
                            {/* <p
                                id="art-labels-heading"
                                className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground"
                            >
                                Labels
                            </p> */}

                            {art.labels && art.labels.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {art.labels.map((label) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => onLabelClick(label)}
                                            className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No labels added.</p>
                            )}
                        </section>

                        <Separator className="my-5" />

                        {/* ==================== LIKES + COMMENT + SHARE | SUPER LIKES ==================== */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={liked ? 'secondary' : 'ghost'}
                                    onClick={() => {
                                        if (!token) {
                                            openLogin()
                                            return
                                        }
                                        likeMutation.mutate()
                                    }}
                                    disabled={likeMutation.isPending}
                                >
                                    <Heart
                                        className={
                                            liked ? 'h-4 w-4 fill-current text-red-500' : 'h-4 w-4'
                                        }
                                    />
                                    <span>Like</span>
                                    <span className="text-xs text-muted-foreground">
                                        {likes.toLocaleString()}
                                    </span>
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        commentsSectionRef.current?.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'start',
                                        })
                                    }
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span>Comment</span>
                                    <span className="text-xs text-muted-foreground">
                                        {(art.comments_count ?? 0).toLocaleString()}
                                    </span>
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => shareArt(art)}
                                >
                                    <Share2 className="h-4 w-4" />
                                    Share
                                </Button>
                            </div>

                            <SuperLikeButton
                                targetType="art"
                                targetId={art.id}
                                initialCount={art.super_likes_count ?? 0}
                                ownerUserId={art.user?.id}
                            />
                        </div>

                        <Separator className="my-5" />

                        {/* ==================== POSTED DATE ==================== */}
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Posted {formatDate(art.created_at)}
                        </p>

                        <Separator className="my-5" />

                        {/* ==================== COMMENTS ==================== */}
                        <div ref={commentsSectionRef} className="scroll-mt-4">
                            <CommentSection
                                targetType="art"
                                targetId={art.id}
                                artistUsername={isAdmin ? null : art.user?.username}
                                title="Comments"
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
                                        onClick={() =>
                                            setZoom((value) => Math.max(1, value - 0.25))
                                        }
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
                                        onClick={() =>
                                            setZoom((value) => Math.min(3, value + 0.25))
                                        }
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

async function shareArt(art: Art) {
    const url = `${window.location.origin}/explore/arts?art=${encodeURIComponent(art.slug || art.id)}`

    try {
        if (navigator.share) {
            await navigator.share({ title: art.title, url })
            return
        }

        await navigator.clipboard.writeText(url)
        toast.success('Art link copied.')
    } catch {
        toast.error('Could not share this art.')
    }
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
