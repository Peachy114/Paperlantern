import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react'
import { useAnnouncements } from '@/features/announcements/hooks/useAnnouncements'
import HeroModal from '@/features/work/components/ui/HeroModal'
import { publicApi } from '@/api/public'
import type { Announcement } from '@/api/announcement'
import { storageUrl } from '@/utils/storage'
import type { PageWidget } from '@/types/pageLayout'
import type { WorkItem } from '@/features/work/hooks/useHome'
import type { Art } from '@/types/art'
import type { CommissionService } from '@/types/commission'

type HeroItem = {
    id: string
    type: 'work' | 'art' | 'commission' | 'announcement'
    title: string
    artist?: string | null
    image: string | null
    href: string
    views?: number
    likes?: number
    labels?: string[]
    featured?: boolean
    announcement?: Announcement
}

// HERO DESIGNS FOR ANNOUNCEMENTS, ARTS, WORKS, AND COMMISSIONS
type CarouselDesign = 'default' | 'reference_1' | 'reference_2' | 'reference_3'

const AUTO_ROTATE_DELAY = 5_000
const DRAG_THRESHOLD = 55

export default function FeaturedHeroWidget({
    widget,
    works,
}: {
    widget: PageWidget
    works: WorkItem[]
}) {
    const settings = widget.settings ?? {}

    const sources = {
        arts: settings.hero_source_arts ?? true,
        announcements: settings.hero_source_announcements ?? true,
        works: settings.hero_source_works ?? true,
        commissions: settings.hero_source_commissions ?? true,
    }

    const limit = settings.limit ?? 10
    const featuredOnly = Boolean(settings.hero_featured_only)

    const { announcements } = useAnnouncements('public')

    const artsQuery = useQuery({
        queryKey: ['featured-hero-arts'],
        enabled: sources.arts,
        queryFn: () => publicApi.getArts().then((res) => res.data),
        staleTime: 60_000,
    })

    const commissionsQuery = useQuery({
        queryKey: ['featured-hero-commissions'],
        enabled: sources.commissions,
        queryFn: () => publicApi.getCommissions().then((res) => res.data),
        staleTime: 60_000,
    })

    const items = useMemo(() => {
        const nextItems: HeroItem[] = []

        if (sources.works) {
            works.forEach((work) => {
                nextItems.push({
                    id: `work-${work.id}`,
                    type: 'work',
                    title: work.title,
                    artist: null,
                    image: storageUrl(work.banner || work.cover),
                    href:
                        work.type === 'art'
                            ? `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}`
                            : `/works/${work.slug}`,
                    views: work.views,
                    likes: work.likes,
                    labels: work.genres,
                    featured: Boolean((work as WorkItem & { is_featured?: boolean }).is_featured),
                })
            })
        }

        if (sources.announcements) {
            announcements.forEach((announcement) => {
                nextItems.push({
                    id: `announcement-${announcement.id}`,
                    type: 'announcement',
                    title: announcement.title,
                    artist: announcement.creator?.name,
                    image: storageUrl(announcement.image ?? null, 'sm'),
                    href: '',
                    labels: announcement.tag ? [announcement.tag] : [],
                    featured: Boolean(
                        (announcement as typeof announcement & { is_featured?: boolean })
                            .is_featured || announcement.is_pinned
                    ),
                    announcement,
                })
            })
        }

        if (sources.arts) {
            const arts = (artsQuery.data?.arts?.data ?? []) as Art[]

            arts.forEach((art) => {
                nextItems.push({
                    id: `art-${art.id}`,
                    type: 'art',
                    title: art.title,
                    artist: art.user?.name ?? art.user?.username,
                    image: storageUrl(art.images?.[0]?.image_path ?? art.image_path),
                    href: `/explore/arts?art=${encodeURIComponent(art.slug || art.id)}`,
                    views: art.views,
                    likes: art.likes,
                    labels: art.labels ?? [],
                    featured: Boolean(
                        (art as Art & { is_featured?: boolean }).is_featured || art.boosted_until
                    ),
                })
            })
        }

        if (sources.commissions) {
            const commissions = (commissionsQuery.data?.commissions?.data ??
                []) as CommissionService[]

            commissions.forEach((commission) => {
                nextItems.push({
                    id: `commission-${commission.id}`,
                    type: 'commission',
                    title: commission.title,
                    artist: commission.artist?.name ?? commission.artist?.username,
                    image: storageUrl(commission.image_path),
                    href: `/commissions?service=${encodeURIComponent(commission.slug)}`,
                    labels: commission.category?.name ? [commission.category.name] : ['Commission'],
                    featured: Boolean(commission.boosted_until),
                })
            })
        }

        const filteredItems = nextItems.filter(
            (item) => item.image && (!featuredOnly || item.featured)
        )

        const fallbackItems = nextItems.filter((item) => item.image)

        return (filteredItems.length > 0 ? filteredItems : fallbackItems).slice(0, limit)
    }, [
        announcements,
        artsQuery.data,
        commissionsQuery.data,
        featuredOnly,
        limit,
        sources.announcements,
        sources.arts,
        sources.commissions,
        sources.works,
        works,
    ])

    const [index, setIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)
    const [announcementModal, setAnnouncementModal] = useState<Announcement | null>(null)

    const dragStartXRef = useRef<number | null>(null)
    const pointerIdRef = useRef<number | null>(null)

    const itemCount = items.length

    const goTo = useCallback(
        (nextIndex: number) => {
            if (itemCount === 0) return

            setIndex(((nextIndex % itemCount) + itemCount) % itemCount)
        },
        [itemCount]
    )

    const prev = useCallback(() => {
        setIndex((currentIndex) => {
            if (itemCount === 0) return 0
            return (currentIndex - 1 + itemCount) % itemCount
        })
    }, [itemCount])

    const next = useCallback(() => {
        setIndex((currentIndex) => {
            if (itemCount === 0) return 0
            return (currentIndex + 1) % itemCount
        })
    }, [itemCount])

    const openItem = useCallback((item: HeroItem) => {
        if (item.type === 'announcement' && item.announcement) {
            setAnnouncementModal(item.announcement)
        }
    }, [])

    useEffect(() => {
        if (itemCount === 0) {
            setIndex(0)
            return
        }

        setIndex((currentIndex) => currentIndex % itemCount)
    }, [itemCount])

    useEffect(() => {
        if (itemCount <= 1 || isHovered || isDragging) return

        const timer = window.setInterval(next, AUTO_ROTATE_DELAY)

        return () => window.clearInterval(timer)
    }, [isDragging, isHovered, itemCount, next])

    const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
        if (itemCount <= 1) return

        dragStartXRef.current = event.clientX
        pointerIdRef.current = event.pointerId
        setIsDragging(true)
        setDragOffset(0)

        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
        if (
            !isDragging ||
            dragStartXRef.current === null ||
            pointerIdRef.current !== event.pointerId
        ) {
            return
        }

        setDragOffset(event.clientX - dragStartXRef.current)
    }

    const finishPointerDrag = (event: ReactPointerEvent<HTMLElement>) => {
        if (pointerIdRef.current !== event.pointerId) return

        if (dragOffset <= -DRAG_THRESHOLD) {
            next()
        } else if (dragOffset >= DRAG_THRESHOLD) {
            prev()
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        dragStartXRef.current = null
        pointerIdRef.current = null
        setIsDragging(false)
        setDragOffset(0)
    }

    if (items.length === 0) return null

    const design = (settings.hero_design ?? 'default') as CarouselDesign
    const currentIndex = index % items.length
    const current = items[currentIndex]
    const previousItem = items[(currentIndex - 1 + items.length) % items.length]
    const nextItem = items[(currentIndex + 1) % items.length]

    const sharedCarouselProps = {
        widget,
        items,
        current,
        currentIndex,
        previousItem,
        nextItem,
        onPrev: prev,
        onNext: next,
        onGoTo: goTo,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: finishPointerDrag,
        onPointerCancel: finishPointerDrag,
        onOpenItem: openItem,
        dragOffset,
        isDragging,
    }

    return (
        <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            {design === 'reference_1' && <BlurredBackgroundHero {...sharedCarouselProps} />}

            {design === 'reference_2' && <OverlappingHero {...sharedCarouselProps} />}

            {design === 'reference_3' && <GappedHero {...sharedCarouselProps} />}

            {design === 'default' && <AnnouncementStyleHero {...sharedCarouselProps} />}

            <HeroModal
                slide={
                    announcementModal
                        ? {
                              kind: 'news',
                              data: announcementModal,
                          }
                        : null
                }
                cover={storageUrl}
                onClose={() => setAnnouncementModal(null)}
            />
        </div>
    )
}

type HeroLayoutProps = {
    widget: PageWidget
    items: HeroItem[]
    current: HeroItem
    currentIndex: number
    previousItem: HeroItem
    nextItem: HeroItem
    onPrev: () => void
    onNext: () => void
    onGoTo: (index: number) => void
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
    onOpenItem: (item: HeroItem) => void
    dragOffset: number
    isDragging: boolean
}

function AnnouncementStyleHero({
    widget,
    items,
    current,
    currentIndex,
    onPrev,
    onNext,
    onGoTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onOpenItem,
    dragOffset,
    isDragging,
}: HeroLayoutProps) {
    return (
        <section className="relative w-full overflow-hidden bg-background">
            <div
                className={`relative h-[360px] w-full touch-pan-y select-none overflow-hidden sm:h-[430px] lg:h-[520px] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <img
                    src={current.image!}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
                />

                <div className="absolute inset-0 bg-black/45" />

                <div className="relative mx-auto flex h-full w-full max-w-[1360px] items-center px-4 sm:px-6">
                    <HeroActionCard
                        item={current}
                        onOpenItem={onOpenItem}
                        className="relative block h-[78%] w-full overflow-hidden rounded-2xl border border-white/20 bg-black/20 shadow-2xl"
                        style={{
                            transform: `translateX(${dragOffset * 0.18}px)`,
                            transition: isDragging ? 'none' : 'transform 300ms ease',
                        }}
                    >
                        <img
                            src={current.image!}
                            alt={current.title}
                            draggable={false}
                            className="h-full w-full object-cover"
                        />
                        <MetaOverlay item={current} widget={widget} />
                    </HeroActionCard>
                </div>

                <CarouselNavigation
                    itemCount={items.length}
                    currentIndex={currentIndex}
                    onPrev={onPrev}
                    onNext={onNext}
                    onGoTo={onGoTo}
                />
            </div>
        </section>
    )
}

function BlurredBackgroundHero({
    widget,
    items,
    current,
    currentIndex,
    previousItem,
    nextItem,
    onPrev,
    onNext,
    onGoTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onOpenItem,
    dragOffset,
    isDragging,
}: HeroLayoutProps) {
    return (
        <section className="relative w-full overflow-hidden py-5 sm:py-7">
            <img
                key={`background-${current.id}`}
                src={current.image!}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
            />

            <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />

            <div
                className={`relative mx-auto flex min-h-[330px] max-w-[1360px] touch-pan-y select-none items-center justify-center px-4 sm:min-h-[390px] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <div
                    className="flex w-full items-center justify-center gap-3 sm:gap-5"
                    style={{
                        transform: `translateX(${dragOffset * 0.25}px)`,
                        transition: isDragging ? 'none' : 'transform 300ms ease',
                    }}
                >
                    <SideImageCard
                        item={previousItem}
                        onClick={onPrev}
                        className="hidden h-[260px] w-[24%] opacity-75 md:block"
                    />

                    <HeroImageCard
                        item={current}
                        widget={widget}
                        onOpenItem={onOpenItem}
                        className="h-[300px] w-full max-w-[760px] sm:h-[350px] md:w-[54%]"
                    />

                    <SideImageCard
                        item={nextItem}
                        onClick={onNext}
                        className="hidden h-[260px] w-[24%] opacity-75 md:block"
                    />
                </div>

                <CarouselNavigation
                    itemCount={items.length}
                    currentIndex={currentIndex}
                    onPrev={onPrev}
                    onNext={onNext}
                    onGoTo={onGoTo}
                />
            </div>
        </section>
    )
}

function OverlappingHero({
    widget,
    items,
    current,
    currentIndex,
    previousItem,
    nextItem,
    onPrev,
    onNext,
    onGoTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onOpenItem,
    dragOffset,
    isDragging,
}: HeroLayoutProps) {
    return (
        <section className="relative w-full overflow-hidden bg-background py-8 sm:py-10">
            <div
                className={`relative mx-auto h-[330px] max-w-[1360px] touch-pan-y select-none px-4 sm:h-[390px] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <div
                    className="relative mx-auto h-full w-full max-w-[1180px]"
                    style={{
                        transform: `translateX(${dragOffset * 0.24}px)`,
                        transition: isDragging ? 'none' : 'transform 300ms ease',
                    }}
                >
                    <SideImageCard
                        item={previousItem}
                        onClick={onPrev}
                        className="absolute left-0 top-1/2 hidden h-[82%] w-[38%] -translate-y-1/2 rounded-2xl opacity-75 shadow-lg md:block"
                    />

                    <SideImageCard
                        item={nextItem}
                        onClick={onNext}
                        className="absolute right-0 top-1/2 hidden h-[82%] w-[38%] -translate-y-1/2 rounded-2xl opacity-75 shadow-lg md:block"
                    />

                    <HeroImageCard
                        item={current}
                        widget={widget}
                        onOpenItem={onOpenItem}
                        className="absolute left-1/2 top-1/2 z-10 h-full w-[min(760px,88vw)] -translate-x-1/2 -translate-y-1/2 rounded-[30px] border-4 border-background shadow-2xl"
                    />
                </div>

                <CarouselNavigation
                    itemCount={items.length}
                    currentIndex={currentIndex}
                    onPrev={onPrev}
                    onNext={onNext}
                    onGoTo={onGoTo}
                />
            </div>
        </section>
    )
}

function GappedHero({
    widget,
    items,
    current,
    currentIndex,
    previousItem,
    nextItem,
    onPrev,
    onNext,
    onGoTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onOpenItem,
    dragOffset,
    isDragging,
}: HeroLayoutProps) {
    return (
        <section className="relative w-full overflow-hidden bg-background py-8 sm:py-10">
            <div
                className={`relative mx-auto flex min-h-[320px] max-w-[1360px] touch-pan-y select-none items-center px-4 sm:min-h-[380px] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <div
                    className="flex w-full items-center justify-center gap-4 sm:gap-6 lg:gap-8"
                    style={{
                        transform: `translateX(${dragOffset * 0.25}px)`,
                        transition: isDragging ? 'none' : 'transform 300ms ease',
                    }}
                >
                    <SideImageCard
                        item={previousItem}
                        onClick={onPrev}
                        className="hidden h-[270px] min-w-0 flex-1 rounded-2xl opacity-80 md:block"
                    />

                    <HeroImageCard
                        item={current}
                        widget={widget}
                        onOpenItem={onOpenItem}
                        className="h-[320px] w-[min(620px,88vw)] shrink-0 rounded-3xl sm:h-[370px]"
                    />

                    <SideImageCard
                        item={nextItem}
                        onClick={onNext}
                        className="hidden h-[270px] min-w-0 flex-1 rounded-2xl opacity-80 md:block"
                    />
                </div>

                <CarouselNavigation
                    itemCount={items.length}
                    currentIndex={currentIndex}
                    onPrev={onPrev}
                    onNext={onNext}
                    onGoTo={onGoTo}
                />
            </div>
        </section>
    )
}

function HeroImageCard({
    item,
    widget,
    onOpenItem,
    className,
}: {
    item: HeroItem
    widget: PageWidget
    onOpenItem: (item: HeroItem) => void
    className: string
}) {
    return (
        <HeroActionCard item={item} onOpenItem={onOpenItem} className={`relative block shrink-0 overflow-hidden bg-muted ${className}`}>
            <img
                src={item.image!}
                alt={item.title}
                draggable={false}
                className="h-full w-full object-cover"
            />
            <MetaOverlay item={item} widget={widget} />
        </HeroActionCard>
    )
}

function HeroActionCard({
    item,
    onOpenItem,
    className,
    style,
    children,
}: {
    item: HeroItem
    onOpenItem: (item: HeroItem) => void
    className: string
    style?: CSSProperties
    children: ReactNode
}) {
    if (item.type === 'announcement') {
        return (
            <button
                type="button"
                draggable={false}
                onClick={() => onOpenItem(item)}
                className={`${className} text-left`}
                style={style}
            >
                {children}
            </button>
        )
    }

    return (
        <Link to={item.href} draggable={false} className={className} style={style}>
            {children}
        </Link>
    )
}

function SideImageCard({
    item,
    onClick,
    className,
}: {
    item: HeroItem
    onClick: () => void
    className: string
}) {
    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.stopPropagation()
    }

    const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
    }

    return (
        <button
            type="button"
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            className={`overflow-hidden bg-muted transition duration-300 hover:opacity-100 ${className}`}
            aria-label={`Show ${item.title}`}
        >
            <img
                src={item.image!}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
            />
        </button>
    )
}

function CarouselNavigation({
    itemCount,
    currentIndex,
    onPrev,
    onNext,
    onGoTo,
}: {
    itemCount: number
    currentIndex: number
    onPrev: () => void
    onNext: () => void
    onGoTo: (index: number) => void
}) {
    if (itemCount <= 1) return null

    const stopPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.stopPropagation()
    }

    const clickNav = (event: ReactMouseEvent<HTMLButtonElement>, callback: () => void) => {
        event.preventDefault()
        event.stopPropagation()
        callback()
    }

    return (
        <>
            <button
                type="button"
                onPointerDown={stopPointer}
                onClick={(event) => clickNav(event, onPrev)}
                className="absolute left-5 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-background/95 text-foreground shadow-lg ring-1 ring-border transition hover:scale-105 sm:left-7"
                aria-label="Previous hero"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>

            <button
                type="button"
                onPointerDown={stopPointer}
                onClick={(event) => clickNav(event, onNext)}
                className="absolute right-5 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-background/95 text-foreground shadow-lg ring-1 ring-border transition hover:scale-105 sm:right-7"
                aria-label="Next hero"
            >
                <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 z-30 flex max-w-[70%] -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur">
                {Array.from({ length: itemCount }).map((_, dotIndex) => (
                    <button
                        key={dotIndex}
                        type="button"
                        onPointerDown={stopPointer}
                        onClick={(event) => clickNav(event, () => onGoTo(dotIndex))}
                        className={`h-2 rounded-full transition-all ${
                            dotIndex === currentIndex
                                ? 'w-6 bg-white'
                                : 'w-2 bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Show hero ${dotIndex + 1}`}
                    />
                ))}
            </div>
        </>
    )
}

function MetaOverlay({
    item,
    widget,
    light = false,
}: {
    item: HeroItem
    widget: PageWidget
    light?: boolean
}) {
    const settings = widget.settings ?? {}
    const labels = item.labels?.slice(0, 2) ?? []

    return (
        <div
            className={`absolute inset-x-0 bottom-0 p-4 sm:p-5 ${
                light
                    ? 'static text-foreground'
                    : 'bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white'
            }`}
        >
            {settings.hero_show_name !== false && (
                <h2 className="line-clamp-2 text-lg font-bold sm:text-2xl">{item.title}</h2>
            )}

            {settings.hero_show_artist !== false && item.artist && (
                <p className="mt-1 text-xs opacity-80 sm:text-sm">{item.artist}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {settings.hero_show_views !== false && typeof item.views === 'number' && (
                    <span>{item.views.toLocaleString()} views</span>
                )}

                {settings.hero_show_likes !== false && typeof item.likes === 'number' && (
                    <span>{item.likes.toLocaleString()} likes</span>
                )}

                {settings.hero_show_favorite && (
                    <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        Favorite
                    </span>
                )}

                {labels.map((label) => (
                    <span
                        key={label}
                        className={
                            settings.hero_label_style === 'plain'
                                ? 'opacity-80'
                                : 'rounded-full bg-white/20 px-2 py-0.5 backdrop-blur'
                        }
                    >
                        {label}
                    </span>
                ))}

                {item.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-black">
                        <Star className="h-3 w-3" />
                        Featured
                    </span>
                )}
            </div>
        </div>
    )
}
