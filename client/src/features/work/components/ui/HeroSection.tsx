import * as React from 'react'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel'
import { useAnnouncements } from '@/hooks/usePublicNews'
import { storageUrl } from '@/utils/storage'
import HeroModal, { type HeroModalSlide } from './HeroModal'

interface HeroWork {
    id: number
    slug: string
    title: string
    description?: string | null
    banner?: string | null
    cover: string | null
    type: 'webtoon' | 'wattpad'
    status?: string
}

interface Announcement {
    id: number
    title: string
    content: string
    image?: string | null
    tag?: 'event' | 'reminder' | 'update'
    is_pinned: boolean
    created_at: string
    creator?: { name?: string | null } | null
}

type Slide = { kind: 'comic'; data: HeroWork } | { kind: 'news'; data: Announcement }

export default function HeroSection({
    hero,
    cover,
    audience = 'public',
}: {
    hero: HeroWork[]
    cover: (path: string | null) => string | null
    audience?: 'public' | 'studio'
}) {
    const { announcements, loading: newsLoading } = useAnnouncements(audience)
    const [api, setApi] = React.useState<CarouselApi>()
    const [selected, setSelected] = React.useState(0)
    const [modalSlide, setModalSlide] = React.useState<HeroModalSlide | null>(null)

    React.useEffect(() => {
        if (!api) return
        setSelected(api.selectedScrollSnap())
        api.on('select', () => setSelected(api.selectedScrollSnap()))
    }, [api])

    const slides: Slide[] = React.useMemo(() => {
        const pinnedNews = announcements
            .filter((a) => a.is_pinned)
            .map((a) => ({ kind: 'news' as const, data: a }))
        const unpinnedNews = announcements
            .filter((a) => !a.is_pinned)
            .map((a) => ({ kind: 'news' as const, data: a }))
        const comicSlides = hero.map((w) => ({ kind: 'comic' as const, data: w }))

        return [...pinnedNews, ...comicSlides, ...unpinnedNews]
    }, [hero, announcements])

    React.useEffect(() => {
        if (!api || slides.length < 2) return
        const id = setInterval(() => api.scrollNext(), 5000)
        return () => clearInterval(id)
    }, [api, slides.length])

    if (!newsLoading && slides.length === 0) return null
    if (slides.length === 0) return null

    return (
        <div>
            <section className="relative w-full mb-16 mt-5">
                <Carousel
                    setApi={setApi}
                    opts={{ loop: slides.length > 2, align: 'center' }}
                    className="w-full"
                >
                    <CarouselContent
                        className={`-ml-4 ${slides.length <= 2 ? 'justify-center' : ''}`}
                    >
                        {slides.map((slide, index) => {
                            const isActive = index === selected

                            return (
                                <CarouselItem
                                    key={`${slide.kind}-${slide.data.id}`}
                                    className="basis-[78%] sm:basis-[70%] md:basis-[62%] pl-4"
                                >
                                    <div
                                        className="p-1"
                                        style={{
                                            position: 'relative',
                                            zIndex: isActive ? 20 : 10,
                                        }}
                                    >
                                        {slide.kind === 'comic' ? (
                                            <ComicSlide
                                                work={slide.data}
                                                cover={cover}
                                                isActive={isActive}
                                                isFirst={index === 0}
                                                onClick={() =>
                                                    isActive
                                                        ? setModalSlide({
                                                              kind: 'comic',
                                                              data: slide.data,
                                                          })
                                                        : api?.scrollTo(index)
                                                }
                                            />
                                        ) : (
                                            <NewsSlide
                                                announcement={slide.data}
                                                isActive={isActive}
                                                isFirst={index === 0}
                                                onClick={() =>
                                                    isActive
                                                        ? setModalSlide({
                                                              kind: 'news',
                                                              data: slide.data,
                                                          })
                                                        : api?.scrollTo(index)
                                                }
                                            />
                                        )}
                                    </div>
                                </CarouselItem>
                            )
                        })}
                    </CarouselContent>

                    {slides.length > 1 && (
                        <>
                            <CarouselPrevious className="left-2 sm:left-6 bg-black/40 border-white/30 text-white hover:bg-black/60" />
                            <CarouselNext className="right-2 sm:right-6 bg-black/40 border-white/30 text-white hover:bg-black/60" />
                        </>
                    )}
                </Carousel>

                {slides.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-4">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => api?.scrollTo(i)}
                                className="cursor-pointer"
                                style={{
                                    width: i === selected ? '20px' : '6px',
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: i === selected ? '#111827' : '#d1d5db',
                                    transition: 'all 0.3s',
                                }}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </section>

            <HeroModal slide={modalSlide} cover={cover} onClose={() => setModalSlide(null)} />
        </div>
    )
}

function ComicSlide({
    work,
    cover,
    isActive,
    isFirst,
    onClick,
}: {
    work: HeroWork
    cover: (path: string | null) => string | null
    isActive: boolean
    isFirst: boolean
    onClick: () => void
}) {
    const imgSrc = cover(work.banner ?? work.cover)

    return (
        <div
            onClick={onClick}
            className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out"
            style={{ height: 'clamp(380px, 46vw, 480px)' }}
        >
            <div
                className="absolute inset-0 transition-all duration-500 ease-out"
                style={{ filter: isActive ? 'brightness(1)' : 'brightness(0.45)' }}
            >
                {imgSrc && (
                    <img
                        src={imgSrc}
                        alt={work.title}
                        loading={isFirst ? 'eager' : 'lazy'}
                        fetchPriority={isFirst ? 'high' : 'auto'}
                        width={900}
                        height={480}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />
            </div>

            <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 pointer-events-none bg-gradient-to-t from-[#1a1712] to-transparent" />

            <div
                className="absolute bottom-6 left-6 right-6"
                style={{ opacity: isActive ? 1 : 0.6 }}
            >
                <div className="inline-block text-[10px] tracking-[0.25em] font-bebas px-2.5 py-0.5 rounded-sm mb-2 bg-amber-500/20 border border-amber-400/60 text-amber-300">
                    {work.type === 'webtoon' ? 'WEBTOON' : 'NOVEL'}
                </div>

                <h1
                    className="text-white leading-[0.95] mb-2 line-clamp-2 font-bebas"
                    style={{
                        fontSize: 'clamp(20px, 3.4vw, 38px)',
                        letterSpacing: '0.02em',
                        textShadow: '0 2px 16px rgba(0,0,0,0.6)',
                    }}
                >
                    {work.title}
                </h1>

                {work.description && (
                    <p className="text-white/70 text-[12px] sm:text-[13px] leading-relaxed mb-3 line-clamp-1">
                        {work.description}
                    </p>
                )}

                <span className="inline-block text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-black">
                    {work.status === 'completed'
                        ? 'COMPLETED'
                        : work.status === 'hiatus'
                          ? 'HIATUS'
                          : 'NEW'}
                </span>
            </div>
        </div>
    )
}

function NewsSlide({
    announcement,
    isActive,
    isFirst,
    onClick,
}: {
    announcement: Announcement
    isActive: boolean
    isFirst: boolean
    onClick: () => void
}) {
    const img = storageUrl(announcement.image ?? null)

    return (
        <div
            onClick={onClick}
            className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out"
            style={{ height: 'clamp(380px, 46vw, 480px)' }}
        >
            <div
                className="absolute inset-0 transition-all duration-500 ease-out"
                style={{ filter: isActive ? 'brightness(1)' : 'brightness(0.45)' }}
            >
                {img ? (
                    <img
                        src={img}
                        alt={announcement.title}
                        loading={isFirst ? 'eager' : 'lazy'}
                        fetchPriority={isFirst ? 'high' : 'auto'}
                        width={900}
                        height={480}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-[#1a1a1a]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />
            </div>

            <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 pointer-events-none bg-gradient-to-t from-[#1a1712] to-transparent" />

            <div className="absolute top-0 left-0 right-0 px-4 sm:px-6 py-2.5 flex items-center justify-between bg-black/40 backdrop-blur-sm">
                <span className="text-amber-400 text-[10px] tracking-[0.25em] font-bebas">
                    ◆ LATER N COMIX TIMES
                </span>
                <span className="text-white/60 text-[9px] tracking-[0.15em] font-bebas">
                    {announcement.is_pinned ? 'PINNED' : 'NEWS'}
                </span>
            </div>

            <div
                className="absolute top-14 right-4 sm:right-6 px-2.5 py-1.5 rotate-[2deg] z-20 font-kalam"
                style={{
                    background:
                        announcement.tag === 'event'
                            ? '#86efac'
                            : announcement.tag === 'reminder'
                              ? '#fca5a5'
                              : '#fef08a',
                    fontSize: '10px',
                    color: '#1a1a1a',
                    boxShadow: '2px 3px 6px rgba(0,0,0,0.15)',
                }}
            >
                {announcement.tag === 'event'
                    ? '🎉 event'
                    : announcement.tag === 'reminder'
                      ? '🔔 reminder'
                      : '📢 update'}
            </div>

            <div
                className="absolute bottom-6 left-6 right-6"
                style={{ opacity: isActive ? 1 : 0.6 }}
            >
                <div className="text-amber-400 mb-2 text-[10px] tracking-[0.25em] font-bebas">
                    ◆ {announcement.is_pinned ? 'PINNED ANNOUNCEMENT' : 'LATEST NEWS'}
                </div>

                <h1
                    className="text-white leading-[0.95] mb-2 line-clamp-2 font-bebas"
                    style={{
                        fontSize: 'clamp(20px, 3.4vw, 38px)',
                        letterSpacing: '0.02em',
                        textShadow: '0 2px 16px rgba(0,0,0,0.6)',
                    }}
                >
                    {announcement.title}
                </h1>

                <p className="text-white/70 text-[12px] sm:text-[13px] leading-relaxed mb-3 line-clamp-1">
                    {announcement.content}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className="px-2 py-1 bg-white/90 text-black shrink-0 font-bebas"
                        style={{
                            fontSize: '9px',
                            letterSpacing: '0.2em',
                        }}
                    >
                        {announcement.creator?.name?.toUpperCase() ?? 'STAFF'}
                    </div>
                    <span className="text-white/60 font-kalam">
                        {new Date(announcement.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                </div>
            </div>
        </div>
    )
}
