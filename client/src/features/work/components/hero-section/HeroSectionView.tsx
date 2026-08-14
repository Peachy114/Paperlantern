import * as React from 'react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { useAnnouncements } from '@/features/announcements/hooks/useAnnouncements'
import HeroModal, { type HeroModalSlide } from '../ui/HeroModal'
import HeroSkeleton from './HeroSkeleton'
import { storageUrl } from '@/utils/storage'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Announcement {
    id: string
    title: string
    content: string
    image?: string | null
    tag?: 'event' | 'reminder' | 'update'
    page_targets?: string[] | null
    placement?: 'banner' | 'hero' | 'both'
    is_pinned: boolean
    created_at: string
    creator?: { name?: string | null } | null
}

const DESKTOP_CARD_WIDTH = 920
const MOBILE_BREAKPOINT = 640
const MOBILE_CARD_RATIO = 0.92

const tagStyles: Record<string, { bg: string; label: string }> = {
    event: { bg: 'var(--chart-2)', label: 'Event' },
    reminder: { bg: 'var(--destructive)', label: 'Reminder' },
    update: { bg: 'var(--comix-badge-new)', label: 'Update' },
}

export default function HeroSectionView({
    audience = 'public',
}: {
    audience?: 'public' | 'artist' | 'studio'
}) {
    const { announcements, loading: newsLoading } = useAnnouncements(audience)
    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)
    const [modalSlide, setModalSlide] = React.useState<HeroModalSlide | null>(null)
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)
    const [viewportWidth, setViewportWidth] = React.useState(() => window.innerWidth)
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (!api) return

        const update = () => {
            setCanScrollPrev(api.canScrollPrev())
            setCanScrollNext(api.canScrollNext())
            setCurrent(api.selectedScrollSnap())
        }

        update()
        api.on('select', update)
        api.on('reInit', update)
    }, [api])

    React.useEffect(() => {
        const update = () => setViewportWidth(window.innerWidth)
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    const isMobile = viewportWidth < MOBILE_BREAKPOINT
    const CARD_WIDTH = isMobile
        ? Math.round(viewportWidth * MOBILE_CARD_RATIO)
        : DESKTOP_CARD_WIDTH

    const slides: Announcement[] = React.useMemo(() => {
        const heroAnnouncements = announcements.filter((announcement) => {
            const targets = announcement.page_targets ?? []
            const matchesPage = targets.length === 0 || targets.includes('home')
            const matchesPlacement =
                !announcement.placement ||
                announcement.placement === 'hero' ||
                announcement.placement === 'both'

            return matchesPage && matchesPlacement
        })

        const pinned = heroAnnouncements.filter((announcement) => announcement.is_pinned)
        const unpinned = heroAnnouncements.filter((announcement) => !announcement.is_pinned)

        return [...pinned, ...unpinned]
    }, [announcements])

    React.useEffect(() => {
        if (!api || slides.length < 2) return
        const id = setInterval(() => api.scrollNext(), 5000)
        return () => clearInterval(id)
    }, [api, slides.length])

    if (newsLoading) return <HeroSkeleton />
    if (slides.length === 0) return null

    const totalContentWidth = slides.length * CARD_WIDTH
    const hasOverflow = totalContentWidth > viewportWidth
    const isLoop = hasOverflow && slides.length > 1
    const needsCentering = !hasOverflow

    return (
        <div ref={containerRef} className="relative w-full overflow-hidden">
            <div className="relative">
                <div className="flex">
                    <Carousel
                        setApi={setApi}
                        opts={{ loop: isLoop, align: 'center' }}
                        className="w-full"
                    >
                        <CarouselContent
                            className={`ml-0 ${needsCentering ? 'justify-center' : ''}`}
                        >
                            {slides.map((announcement, index) => {
                                const img = storageUrl(announcement.image ?? null)
                                const backdropImg =
                                    storageUrl(announcement.image ?? null, 'sm') ?? img

                                if (!img) return null

                                return (
                                    <CarouselItem
                                        key={`${announcement.id}-${index}`}
                                        className="basis-auto shrink-0 px-1 pl-0 sm:px-2"
                                        style={{ width: CARD_WIDTH }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setModalSlide({
                                                    kind: 'news',
                                                    data: announcement,
                                                })
                                            }
                                            className="relative block w-full overflow-hidden rounded-[18px] text-left shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                                            style={{
                                                aspectRatio: isMobile ? '4 / 5' : '3 / 2',
                                            }}
                                        >
                                            <div
                                                className="absolute inset-0 overflow-hidden"
                                                style={{ background: '#111118' }}
                                            >
                                                {backdropImg && (
                                                    <img
                                                        src={backdropImg}
                                                        alt=""
                                                        aria-hidden="true"
                                                        loading={index === 0 ? 'eager' : 'lazy'}
                                                        decoding="async"
                                                        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
                                                    />
                                                )}

                                                <div className="absolute inset-0 bg-black/25" />

                                                <img
                                                    src={img}
                                                    alt={announcement.title}
                                                    loading={index === 0 ? 'eager' : 'lazy'}
                                                    fetchPriority={index === 0 ? 'high' : 'auto'}
                                                    decoding="async"
                                                    className="relative z-[1] h-full w-full object-contain"
                                                />
                                            </div>

                                            <span
                                                className="badge-game absolute left-2 top-2 z-10 rounded-full p-3 sm:left-3 sm:top-3"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.12)',
                                                    color: '#fff',
                                                    backdropFilter: 'blur(8px)',
                                                    WebkitBackdropFilter: 'blur(8px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                }}
                                            >
                                                {index + 1} / {slides.length}
                                            </span>

                                            {announcement.is_pinned && (
                                                <span className="badge-game badge-game-pink absolute right-2 top-2 z-10 rounded-full sm:right-3 sm:top-3">
                                                    Pinned
                                                </span>
                                            )}

                                            <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/90 via-black/5 to-transparent" />

                                            <div className="absolute bottom-0 left-0 right-0 z-[3] p-4 sm:p-5">
                                                {announcement.tag &&
                                                    tagStyles[announcement.tag] && (
                                                        <span
                                                            className="mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]"
                                                            style={{
                                                                background:
                                                                    tagStyles[announcement.tag].bg,
                                                                color: '#fff',
                                                            }}
                                                        >
                                                            {tagStyles[announcement.tag].label}
                                                        </span>
                                                    )}

                                                <h2
                                                    className="text-base leading-tight text-white sm:text-xl"
                                                    style={{
                                                        fontFamily: 'var(--comix-font-display)',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {announcement.title} "hero for announcement"
                                                </h2>

                                                <p className="mt-1 line-clamp-2 text-[11px] text-white/75 sm:text-sm">
                                                    {announcement.content}
                                                </p>
                                            </div>
                                        </button>
                                    </CarouselItem>
                                )
                            })}
                        </CarouselContent>
                    </Carousel>
                </div>

                {slides.length > 1 && canScrollPrev && (
                    <button
                        type="button"
                        onClick={() => api?.scrollPrev()}
                        aria-label="Previous"
                        className="absolute left-2 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white transition-shadow md:flex"
                        style={{
                            background: 'var(--comix-void)',
                            border: '1px solid var(--border)',
                        }}
                        onMouseEnter={(event) =>
                            (event.currentTarget.style.boxShadow =
                                '0 0 10px 1px rgba(47,243,208,0.5)')
                        }
                        onMouseLeave={(event) =>
                            (event.currentTarget.style.boxShadow = 'none')
                        }
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                )}

                {slides.length > 1 && canScrollNext && (
                    <button
                        type="button"
                        onClick={() => api?.scrollNext()}
                        aria-label="Next"
                        className="absolute right-2 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white transition-shadow md:flex"
                        style={{
                            background: 'var(--comix-void)',
                            border: '1px solid var(--border)',
                        }}
                        onMouseEnter={(event) =>
                            (event.currentTarget.style.boxShadow =
                                '0 0 10px 1px rgba(47,243,208,0.5)')
                        }
                        onMouseLeave={(event) =>
                            (event.currentTarget.style.boxShadow = 'none')
                        }
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                )}
            </div>

            {slides.length > 1 && (
                <div className="relative mt-3 flex justify-center gap-1.5">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            className="h-1.5 rounded-full transition-all"
                            style={{
                                width: index === current ? 20 : 6,
                                background:
                                    index === current
                                        ? 'var(--comix-orange)'
                                        : 'rgba(255,255,255,0.25)',
                            }}
                        />
                    ))}
                </div>
            )}

            <HeroModal
                slide={modalSlide}
                cover={storageUrl}
                onClose={() => setModalSlide(null)}
            />
        </div>
    )
}
