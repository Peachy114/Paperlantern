import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import RankBadge from './RankBadge'
import SectionHeader from './SectionHeader'
import Pagination from './Pagination'
import { usePagination, PAGE_SIZE } from '../../hooks/usePagination'

interface Work {
    id: number
    title: string
    cover: string | null
    type: 'webtoon' | 'wattpad'
    likes?: number
}

const RANK_COLORS = [
    { color: '#f59e0b', glow: 'rgba(245,158,11,0.7)' },
    { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)' },
    { color: '#f472b6', glow: 'rgba(244,114,182,0.5)' },
    { color: '#fda4af', glow: 'rgba(253,164,175,0.5)' },
    { color: '#f59e0b', glow: 'rgba(245,158,11,0.7)' },
    { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)' },
    { color: '#f472b6', glow: 'rgba(244,114,182,0.5)' },
    { color: '#fda4af', glow: 'rgba(253,164,175,0.5)' },
    { color: '#f59e0b', glow: 'rgba(245,158,11,0.7)' },
    { color: '#fda4af', glow: 'rgba(253,164,175,0.5)' },
]

export default function WeeklyChartSection({
    weeklyChart,
    cover,
}: {
    weeklyChart: Work[]
    cover: (path: string | null) => string | null
}) {
    const weekly = usePagination(weeklyChart)
    if (weeklyChart.length === 0) return null

    return (
        <section className="mb-14">
            <SectionHeader title="Weekly Chart" subtitle="Top by views this week" color="#14b8a6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {weekly.paginated.map((work, i) => (
                    <motion.div
                        key={work.id}
                        className="relative"
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.055, duration: 0.32, ease: 'easeOut' }}
                    >
                        <RankBadge
                            color={RANK_COLORS[i]?.color ?? '#6b7280'}
                            glow={RANK_COLORS[i]?.glow ?? 'rgba(107,114,128,0.4)'}
                        />
                        <Card
                            id={work.id}
                            title={work.title}
                            cover={cover(work.cover)}
                            type={work.type}
                            likes={work.likes ?? 0}
                            rank={(weekly.page - 1) * PAGE_SIZE + i + 1}
                        />
                    </motion.div>
                ))}
            </div>
            <Pagination
                page={weekly.page}
                totalPages={weekly.totalPages}
                setPage={weekly.setPage}
            />
        </section>
    )
}
