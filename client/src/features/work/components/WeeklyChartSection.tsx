import { Link } from 'react-router-dom'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import type { WorkItem } from '@/features/work/hooks/useHome'

const MAX_CARDS = 10

export default function WeeklyChartSection({
    weeklyChart,
    cover,
    metric = 'likes',
}: {
    weeklyChart: WorkItem[]
    cover: (path: string | null, variant?: 'sm') => string | null
    metric?: 'views' | 'likes'
}) {
    const works = weeklyChart.slice(0, MAX_CARDS)

    if (works.length === 0) return null

    const hrefFor = (work: WorkItem) => {
        if (work.type === 'art')
            return `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}`
        if (work.content_type === 'chapter' && work.chapter_slug)
            return `/works/${work.slug}/chapters/${work.chapter_slug}`
        return `/works/${work.slug}`
    }

    const imageFor = (work: WorkItem) => cover(work.cover, work.type === 'art' ? undefined : 'sm')

    const labelFor = (work: WorkItem) => {
        if (metric === 'likes') return `${work.period_likes ?? work.likes ?? 0} likes this week`
        return `${work.period_views ?? work.views ?? 0} views this week`
    }

    return (
        // Weekly Chart Section ----
        <section className="w-full overflow-hidden px-3 py-12 sm:px-4 sm:py-16">
            <div className="mx-auto my-5 w-full max-w-[1480px] sm:mt-5">
                <h2 className="py-5 text-2xl font-bold">WEEKLY CHART</h2>

                <Carousel
                    opts={{ loop: true, align: 'start', dragFree: true }}
                    className="mt-5 w-full"
                >
                    <CarouselContent className="-ml-4 sm:-ml-5 lg:-ml-6">
                        {works.map((work, index) => {
                            const image = imageFor(work)

                            return (
                                <CarouselItem
                                    key={`${work.content_type ?? 'work'}-${work.id}`}
                                    className="basis-1/2 pl-4 sm:basis-1/3 sm:pl-5 md:basis-1/4 lg:basis-1/5 lg:pl-6"
                                >
                                    <Link to={hrefFor(work)} className="group block h-full">
                                        <article className="flex h-full flex-col">
                                            {/* Portrait cover */}
                                            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                                                {image && (
                                                    <img
                                                        src={image}
                                                        alt={work.title}
                                                        width={280}
                                                        height={373}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                )}

                                                {/* Rank badge */}
                                                <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/60 px-1.5 text-xs font-bold text-white backdrop-blur-sm">
                                                    {index + 1}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug">
                                                {work.title}
                                            </h3>

                                            {/* Metric */}
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                {labelFor(work)}
                                            </p>
                                        </article>
                                    </Link>
                                </CarouselItem>
                            )
                        })}
                    </CarouselContent>

                    <CarouselPrevious className="left-0" />
                    <CarouselNext className="right-0" />
                </Carousel>
            </div>
        </section>
    )
}