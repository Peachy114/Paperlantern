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
    is_pinned: boolean
    created_at: string
    creator?: { name?: string | null } | null
}

const DESKTOP_CARD_WIDTH = 780
const MOBILE_BREAKPOINT = 640
const MOBILE_CARD_RATIO = 0.85

const tagStyles: Record<string, { bg: string; label: string }> = {
    event: { bg: 'var(--chart-2)', label: 'Event' },
    reminder: { bg: 'var(--destructive)', label: 'Reminder' },
    update: { bg: 'var(--comix-badge-new)', label: 'Update' },
}

export default function HeroSectionView({
    audience = 'public',
}: {
    audience?: 'public' | 'studio'
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
    const CARD_WIDTH = isMobile ? Math.round(viewportWidth * MOBILE_CARD_RATIO) : DESKTOP_CARD_WIDTH

    const slides: Announcement[] = React.useMemo(() => {
        const pinned = announcements.filter((a) => a.is_pinned)
        const unpinned = announcements.filter((a) => !a.is_pinned)
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
        <div ref={containerRef} className="relative w-full overflow-hidden ">
            {/* Main carousel */}
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
                                const img = storageUrl(announcement.image ?? null, 'sm')
                                if (!img) return null
                                return (
                                    <CarouselItem
                                        key={`${announcement.id}-${index}`}
                                        className="basis-auto shrink-0 pl-0"
                                        style={{ width: CARD_WIDTH }}
                                    >
                                        <button
                                            onClick={() =>
                                                setModalSlide({ kind: 'news', data: announcement })
                                            }
                                            className="relative overflow-hidden text-left block w-full focus:outline-none"
                                            style={{ aspectRatio: isMobile ? '2 / 3' : '5 / 4' }}
                                        >
                                            <div
                                                className="absolute inset-0"
                                                style={{ background: '#1a1a22' }}
                                            >
                                                {img ? (
                                                    <img
                                                        src={img}
                                                        alt={announcement.title}
                                                        loading={index === 0 ? 'eager' : 'lazy'}
                                                        fetchPriority={
                                                            index === 0 ? 'high' : 'auto'
                                                        }
                                                        decoding="async"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full"
                                                        style={{ background: '#1a1a22' }}
                                                    />
                                                )}
                                            </div>

                                            {/* Slide counter — glass style */}
                                            <span
                                                className="badge-game absolute top-2 left-2 sm:top-3 sm:left-3 z-10 rounded-full p-3"
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
                                                <span className="badge-game badge-game-pink absolute top-2 right-2 sm:top-3 sm:right-3 z-10 rounded-full">
                                                    Pinned
                                                </span>
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                                                {announcement.tag &&
                                                    tagStyles[announcement.tag] && (
                                                        <span
                                                            className="inline-block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
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
                                                    className="text-base sm:text-lg text-white leading-tight"
                                                    style={{
                                                        fontFamily: 'var(--comix-font-display)',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {announcement.title} "hero for announcement"
                                                </h2>
                                                <p className="text-[11px] sm:text-xs text-white/70 mt-1 line-clamp-1">
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
                        onClick={() => api?.scrollPrev()}
                        aria-label="Previous"
                        className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-30 w-9 h-9 items-center justify-center text-white transition-shadow rounded-full"
                        style={{
                            background: 'var(--comix-void)',
                            border: '1px solid var(--border)',
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.boxShadow = '0 0 10px 1px rgba(47,243,208,0.5)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                {slides.length > 1 && canScrollNext && (
                    <button
                        onClick={() => api?.scrollNext()}
                        aria-label="Next"
                        className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-30 w-9 h-9 items-center justify-center text-white transition-shadow rounded-full"
                        style={{
                            background: 'var(--comix-void)',
                            border: '1px solid var(--border)',
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.boxShadow = '0 0 10px 1px rgba(47,243,208,0.5)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Progression rail */}
            {slides.length > 1 && (
                <div className="relative flex justify-center gap-1.5 mt-3">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => api?.scrollTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className="h-1.5 rounded-full transition-all"
                            style={{
                                width: i === current ? 20 : 6,
                                background:
                                    i === current
                                        ? 'var(--comix-orange)'
                                        : 'rgba(255,255,255,0.25)',
                            }}
                        />
                    ))}
                </div>
            )}

            <HeroModal slide={modalSlide} cover={storageUrl} onClose={() => setModalSlide(null)} />
        </div>
    )
}
