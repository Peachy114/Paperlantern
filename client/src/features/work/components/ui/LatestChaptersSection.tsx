import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import SectionHeader from './SectionHeader'
import Pagination from './Pagination'
import { usePagination } from '../../hooks/usePagination'

interface Chapter {
    id: number
    order: number
    title: string
    cover?: string | null
    work: {
        id: number
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
    const latest = usePagination(latestChapters.filter((c) => c.work != null))
    if (latest.paginated.length === 0) return null

    return (
        <section className="mb-14">
            <SectionHeader title="Latest Chapters" subtitle="Recently updated" color="#f59e0b" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {latest.paginated.map((chapter, i) => (
                    <motion.div
                        key={chapter.id}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.055, duration: 0.32, ease: 'easeOut' }}
                    >
                        <Card
                            id={chapter.work!.id}
                            title={chapter.work!.title}
                            cover={cover(chapter.cover ?? chapter.work!.cover)}
                            chapter={{ order: chapter.order, title: chapter.title }}
                        />
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
