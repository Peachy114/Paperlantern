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
    status?: 'draft' | 'ongoing' | 'completed' | 'hiatus'
    type: 'webtoon' | 'wattpad'
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

    return (
        <section className="mt-10 sm:mt-5 w-full max-w-[1360px] mx-auto px-5">
            <h2 className="text-2xl font-bold py-5">FRESH RELEASE</h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {fresh.paginated.map((work, i) => (
                    <motion.div
                        key={work.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
                    >
                        <Link to={`/works/${work.slug}`} className="group block">
                            {/* Portrait cover */}
                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                                {cover(work.cover, 'sm') && (
                                    <img
                                        src={cover(work.cover, 'sm')!}
                                        alt={work.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                )}
                                {work.status === 'completed' && (
                                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white">
                                        COMPLETED
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="font-semibold text-sm mt-2 line-clamp-2 leading-snug">
                                {work.title}
                            </h3>

                            {/* Type */}
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {work.type === 'webtoon' ? 'Webtoon' : 'Novel'}
                            </p>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <Pagination page={fresh.page} totalPages={fresh.totalPages} setPage={fresh.setPage} />
        </section>
    )
}
