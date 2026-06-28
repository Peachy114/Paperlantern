import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Pagination from './ui/Pagination'
import { usePagination } from '../hooks/usePagination'

interface Chapter {
    id: number
    order: number
    title: string
    cover?: string | null
    work: {
        id: number
        slug: string
        title: string
        cover: string | null
    } | null
}

export default function LatestChaptersSection({
    latestChapters,
    cover,
}: {
    latestChapters: Chapter[]
    cover: (path: string | null) => string | null
}) {
    const deduped = latestChapters
        .filter((c) => c.work != null)
        .reduce<Chapter[]>((acc, chapter) => {
            const already = acc.find((c) => c.work!.slug === chapter.work!.slug)
            if (!already) acc.push(chapter)
            return acc
        }, [])

    const latest = usePagination(deduped)
    if (latest.paginated.length === 0) return null

    return (
        <section className="mt-10 w-full max-w-[1360px] mx-auto px-5">
            <h2 className="text-2xl font-bold uppercase py-5">LATEST CHAPTER</h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {latest.paginated.map((chapter, i) => (
                    <motion.div
                        key={chapter.work!.slug}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
                    >
                        <Link to={`/works/${chapter.work!.slug}`} className="group block">
                            {/* Portrait cover */}
                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                                {cover(chapter.cover ?? chapter.work!.cover) && (
                                    <img
                                        src={cover(chapter.cover ?? chapter.work!.cover)!}
                                        alt={chapter.work!.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="font-semibold text-sm mt-2 line-clamp-2 leading-snug">
                                {chapter.work!.title}
                            </h3>

                            {/* Chapter info */}
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                Ch. {chapter.order} · {chapter.title}
                            </p>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <Pagination
                page={latest.page}
                totalPages={latest.totalPages}
                setPage={latest.setPage}
            />
        </section>
    )
}
