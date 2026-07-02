import * as React from 'react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { useAnnouncements } from '@/hooks/usePublicNews'
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

// Desktop card size — used once we know we have room for it
const DESKTOP_CARD_WIDTH = 700
const MOBILE_BREAKPOINT = 640 // ← was 200, fixed back to 640
const MOBILE_CARD_RATIO = 0.78 // ← smaller card, clearer peek both sides

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
    const [viewportWidth, setViewportWidth] = React.useState(0)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Track prev/next availability
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

    // Track available width — drives both card sizing and loop-duplication math
    React.useEffect(() => {
        const update = () => setViewportWidth(window.innerWidth)
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    const isMobile = viewportWidth > 0 && viewportWidth < MOBILE_BREAKPOINT

    // On mobile, card is a fraction of viewport width so the next card peeks in.
    const CARD_WIDTH = isMobile ? Math.round(viewportWidth * MOBILE_CARD_RATIO) : DESKTOP_CARD_WIDTH
    const CARD_GAP = isMobile ? 8 : 12

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

    const totalContentWidth = slides.length * (CARD_WIDTH + CARD_GAP)
    const hasOverflow = totalContentWidth > viewportWidth

    const isLoop = hasOverflow && slides.length > 1
    const needsCentering = !hasOverflow

    return (
        <div
            ref={containerRef}
            className="relative w-full pt-30 sm:pt-40 py-6 sm:py-10 px-3 sm:px-4 overflow-hidden bg-black"
        >
            {/* Ambient blurred background — crossfades to match the active slide's image */}
            <div className="absolute inset-0">
                {slides.map((announcement, index) => {
                    const img = storageUrl(announcement.image ?? null)
                    if (!img) return null
                    return (
                        <div
                            key={`${announcement.id}-${index}`}
                            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                            style={{ opacity: index === current ? 1 : 0 }}
                        >
                            <div
                                className="absolute inset-0 bg-center bg-cover scale-125 blur-3xl"
                                style={{ backgroundImage: `url(${img})` }}
                            />
                        </div>
                    )
                })}
                <div className="absolute inset-0 bg-black/55" />
            </div>

            {/* Bottom fade — white in light mode, black in dark mode */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-100 sm:h-100 bg-gradient-to-t from-white dark:from-black to-transparent" />

            {/* Main carousel — multiple cards visible */}
            <div className="relative">
                <div className="flex">
                    <Carousel
                        setApi={setApi}
                        opts={{ loop: isLoop, align: 'center' }}
                        className="w-full"
                    >
                        <CarouselContent
                            className={`ml-0 ${needsCentering ? 'justify-center' : ''}`}
                            style={{ marginLeft: -CARD_GAP }}
                        >
                            {slides.map((announcement, index) => {
                                const img = storageUrl(announcement.image ?? null, 'sm')
                                if (!img) return null
                                return (
                                    <CarouselItem
                                        key={`${announcement.id}-${index}`}
                                        className="basis-auto shrink-0 pl-2 sm:pl-3"
                                        style={{ width: CARD_WIDTH }}
                                    >
                                        <button
                                            onClick={() =>
                                                setModalSlide({ kind: 'news', data: announcement })
                                            }
                                            className="relative overflow-hidden rounded-lg text-left block w-full aspect-[4/5] sm:aspect-[7/5] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                                        >
                                            <div className="absolute inset-0 bg-zinc-900">
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
                                                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                                                )}
                                            </div>

                                            {/* Slide counter badge */}
                                            <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 rounded-full bg-black/55 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-white backdrop-blur-sm">
                                                {index + 1} / {slides.length}
                                            </span>

                                            {/* Gradient + text overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                                                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                                                    {announcement.title}
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
                        className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-30 w-9 h-9 items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                {slides.length > 1 && canScrollNext && (
                    <button
                        onClick={() => api?.scrollNext()}
                        aria-label="Next"
                        className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-30 w-9 h-9 items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Dots */}
            {slides.length > 1 && (
                <div className="relative flex justify-center gap-1.5 mt-2 sm:mt-3">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => api?.scrollTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all ${
                                i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/30'
                            }`}
                        />
                    ))}
                </div>
            )}

            <HeroModal slide={modalSlide} cover={storageUrl} onClose={() => setModalSlide(null)} />
        </div>
    )
}
