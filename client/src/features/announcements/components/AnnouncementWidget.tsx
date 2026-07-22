import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { useAnnouncements } from '@/features/announcements/hooks/useAnnouncements'
import HeroModal, { type HeroModalSlide } from '@/features/work/components/ui/HeroModal'
import { storageUrl } from '@/utils/storage'

const tagLabels: Record<string, string> = {
    event: 'Event',
    reminder: 'Reminder',
    update: 'Update',
}

export default function AnnouncementWidget({
    audience = 'public',
}: {
    audience?: 'public' | 'studio'
}) {
    const { announcements, loading, error } = useAnnouncements(audience)
    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)
    const [modalSlide, setModalSlide] = React.useState<HeroModalSlide | null>(null)

    const slides = React.useMemo(() => {
        const pinned = announcements.filter((announcement) => announcement.is_pinned)
        const unpinned = announcements.filter((announcement) => !announcement.is_pinned)
        return [...pinned, ...unpinned]
    }, [announcements])

    React.useEffect(() => {
        if (!api) return
        const update = () => setCurrent(api.selectedScrollSnap())
        update()
        api.on('select', update)
        api.on('reInit', update)
    }, [api])

    React.useEffect(() => {
        if (!api || slides.length < 2) return
        const seconds = slides[current]?.rotation_seconds
        const delay = seconds && seconds > 0 ? seconds * 1000 : 5000
        const timer = window.setInterval(() => api.scrollNext(), delay)
        return () => window.clearInterval(timer)
    }, [api, current, slides])

    if (loading) {
        return (
            <div className="mx-auto mt-8 h-40 w-full max-w-[1360px] animate-pulse rounded-lg bg-muted" />
        )
    }

    if (error || slides.length === 0) return null

    return (
        <section className="mx-auto mt-8 w-full max-w-[1360px] px-5">
            <Carousel
                setApi={setApi}
                opts={{ loop: slides.length > 1, align: 'center' }}
                className="w-full"
            >
                <CarouselContent className="ml-0">
                    {slides.map((announcement, index) => {
                        const image =
                            storageUrl(announcement.image ?? null, 'sm') ??
                            storageUrl(announcement.image ?? null)

                        return (
                            <CarouselItem key={announcement.id} className="basis-full pl-0">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setModalSlide({ kind: 'news', data: announcement })
                                    }
                                    className="group relative block h-44 w-full overflow-hidden rounded-lg bg-muted text-left outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-56"
                                >
                                    {image ? (
                                        <img
                                            src={image}
                                            alt={announcement.title}
                                            loading={index === 0 ? 'eager' : 'lazy'}
                                            decoding="async"
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-[linear-gradient(135deg,#24212c,#111)]" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />
                                    <div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-center p-5 text-white sm:p-8">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            {announcement.tag && (
                                                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">
                                                    {tagLabels[announcement.tag] ??
                                                        announcement.tag}{' '}
                                                    "hero for announcement"
                                                </span>
                                            )}
                                            {announcement.is_pinned && (
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                                                    Pinned
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="line-clamp-2 text-xl font-bold leading-tight sm:text-3xl">
                                            {announcement.title}
                                        </h2>
                                        <p className="mt-2 line-clamp-2 text-sm text-white/75">
                                            {announcement.content}
                                        </p>
                                    </div>
                                </button>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>

                {slides.length > 1 && (
                    <>
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="secondary"
                            onClick={() => api?.scrollPrev()}
                            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full md:inline-flex"
                            aria-label="Previous announcement"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="secondary"
                            onClick={() => api?.scrollNext()}
                            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full md:inline-flex"
                            aria-label="Next announcement"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </Carousel>

            {slides.length > 1 && (
                <div className="mt-3 flex justify-center gap-1.5">
                    {slides.map((slide, index) => (
                        <button
                            key={slide.id}
                            type="button"
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Go to announcement ${index + 1}`}
                            className={`h-1.5 rounded-full transition-all ${index === current ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
                        />
                    ))}
                </div>
            )}

            <HeroModal slide={modalSlide} cover={storageUrl} onClose={() => setModalSlide(null)} />
        </section>
    )
}
