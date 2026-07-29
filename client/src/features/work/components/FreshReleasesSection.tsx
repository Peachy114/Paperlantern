import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Pagination from './ui/Pagination'
import { usePagination } from '../hooks/usePagination'

interface Work {
    id: string
    slug: string
    title: string
    cover: string | null
    description?: string
    created_at?: string
    status?: 'draft' | 'ongoing' | 'completed' | 'hiatus' | 'published'
    type: 'webtoon' | 'wattpad' | 'art'
}

export default function FreshReleasesSection({
    freshReleases,
    cover,
}: {
    freshReleases: Work[]
    cover: (path: string | null, variant?: 'sm') => string | null
}) {
    const fresh = usePagination(freshReleases)

    if (freshReleases.length === 0) return null

    const hrefFor = (work: Work) =>
        work.type === 'art'
            ? `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}`
            : `/works/${work.slug}`

    const imageFor = (work: Work) => cover(work.cover, work.type === 'art' ? undefined : 'sm')

    return (
        // Fresh Releases Section ----
        <section className="w-full overflow-hidden bg-gradient-to-br from-sky-50 via-background to-amber-50 px-3 py-12 sm:px-4 sm:py-16 dark:from-sky-950/20 dark:via-background dark:to-amber-950/20">
            <div className="mx-auto mt-10 w-full max-w-[1360px] sm:mt-5">
                <h2 className="py-5 text-2xl font-bold">FRESH RELEASES</h2>

                <div
                    className="
                    grid
                    grid-cols-2
                    items-stretch
                    gap-4
                    sm:grid-cols-3
                    sm:gap-5
                    md:grid-cols-4
                    lg:grid-cols-5
                    lg:gap-6
                "
                >
                    {fresh.paginated.map((work, index) => {
                        const image = imageFor(work)

                        return (
                            <motion.div
                                key={work.id}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    delay: index * 0.05,
                                    duration: 0.3,
                                    ease: 'easeOut',
                                }}
                                className="h-full"
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
                                                    className="
                                                    h-full
                                                    w-full
                                                    object-cover
                                                    transition-transform
                                                    duration-300
                                                    group-hover:scale-105
                                                "
                                                />
                                            )}

                                            {work.status === 'completed' && (
                                                <span
                                                    className="
                                                    absolute
                                                    right-2
                                                    top-2
                                                    rounded-md
                                                    bg-black/60
                                                    px-2
                                                    py-1
                                                    text-[10px]
                                                    font-semibold
                                                    text-white
                                                    backdrop-blur-sm
                                                "
                                                >
                                                    COMPLETED
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug">
                                            {work.title}
                                        </h3>

                                        {/* Type */}
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {work.type === 'art'
                                                ? 'Art'
                                                : work.type === 'webtoon'
                                                  ? 'Webtoon'
                                                  : 'Novel'}
                                        </p>
                                    </article>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>

                <Pagination
                    page={fresh.page}
                    totalPages={fresh.totalPages}
                    setPage={fresh.setPage}
                />
            </div>
        </section>
    )
}
