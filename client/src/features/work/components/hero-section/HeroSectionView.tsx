import * as React from 'react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { useAnnouncements } from '@/hooks/usePublicNews'
import HeroModal, { type HeroModalSlide } from '../ui/HeroModal'
import HeroNewsSlide from './HeroNewsSlide'
import HeroComicSlide from './HeroComicSlide'
import HeroSkeleton from './HeroSkeleton'
import type { HeroWork, Slide } from '@/features/work/components/hero-section/hero.types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function HeroSectionView({
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
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    React.useEffect(() => {
        if (!api) return
        const update = () => {
            setCanScrollPrev(api.canScrollPrev())
            setCanScrollNext(api.canScrollNext())
        }
        update()
        api.on('select', update)
        api.on('reInit', update)
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

    if (newsLoading) return <HeroSkeleton />
    if (slides.length === 0) return null

    const isLoop = slides.length > 2

    return (
        <div className="relative select-none">
            <span className="absolute -left-30 [writing-mode:vertical-rl] rotate-180 font-display text-black/40 font-bold text-8xl h-220">
                LATER N COMIX
            </span>
            <section className="w-full max-w-[1360px] mx-auto py-3">
                <Carousel
                    setApi={setApi}
                    opts={{ loop: isLoop, align: 'center' }}
                    className="w-full relative"
                >
                    <CarouselContent className="ml-0">
                        {slides.map((slide, index) => {
                            const isActive = index === selected
                            return (
                                <CarouselItem
                                    key={`${slide.kind}-${slide.data.id}`}
                                    className="pl-0 basis-[80%] md:basis-[50%] lg:basis-[40%]"
                                >
                                    <div
                                        className={`relative transition-all duration-300 ${
                                            isActive ? 'scale-100 opacity-100' : 'scale-90'
                                        }`}
                                    >
                                        {!isActive && (
                                            <div className="absolute inset-0 bg-black/50 z-10 rounded-lg pointer-events-none" />
                                        )}
                                        {slide.kind === 'comic' ? (
                                            <HeroComicSlide
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
                                            <HeroNewsSlide
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
                            {canScrollPrev && (
                                <button
                                    onClick={() => api?.scrollPrev()}
                                    className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 items-center justify-center rounded-full bg-white/20 border border-white/30 text-white hover:bg-white/40 cursor-pointer"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}

                            {canScrollNext && (
                                <button
                                    onClick={() => api?.scrollNext()}
                                    className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 items-center justify-center rounded-full bg-white/20 border border-white/30 text-white hover:bg-white/40 cursor-pointer"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </>
                    )}

                    {slides.length > 1 && (
                        <div className="flex justify-center gap-2 mt-3">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => api?.scrollTo(i)}
                                    aria-label={`Go to slide ${i + 1}`}
                                    className={`h-2 rounded-full transition-all ${
                                        i === selected ? 'w-6 bg-black' : 'w-2 bg-black/40'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </Carousel>
            </section>
            <HeroModal slide={modalSlide} cover={cover} onClose={() => setModalSlide(null)} />
        </div>
    )
}
