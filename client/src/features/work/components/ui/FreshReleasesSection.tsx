import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import SectionHeader from './SectionHeader'
import Pagination from './Pagination'
import { usePagination } from '../../hooks/usePagination'

interface Work {
    id: number
    title: string
    cover: string | null
    type: 'webtoon' | 'wattpad'
}

export default function FreshReleasesSection({
    freshReleases,
    cover,
}: {
    freshReleases: Work[]
    cover: (path: string | null) => string | null
}) {
    const fresh = usePagination(freshReleases)
    if (freshReleases.length === 0) return null

    return (
        <section className="mb-14">
            <SectionHeader title="Fresh Releases" subtitle="New works this week" color="#f97316" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {fresh.paginated.map((work, i) => (
                    <motion.div
                        key={work.id}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.055, duration: 0.32, ease: 'easeOut' }}
                    >
                        <Card
                            id={work.id}
                            title={work.title}
                            cover={cover(work.cover)}
                            type={work.type}
                        />
                    </motion.div>
                ))}
            </div>
            <Pagination page={fresh.page} totalPages={fresh.totalPages} setPage={fresh.setPage} />
        </section>
    )
}
