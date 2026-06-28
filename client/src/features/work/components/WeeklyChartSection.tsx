import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import WorkCard from '@/features/work/components/ui/WorkCard'

interface Work {
    id: number
    slug: string
    title: string
    cover: string | null
    type: 'webtoon' | 'wattpad'
    likes?: number
}

export default function WeeklyChartSection({
    weeklyChart,
    cover,
}: {
    weeklyChart: Work[]
    cover: (path: string | null) => string | null
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const updateButtons = () => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 0)
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        updateButtons()
        el.addEventListener('scroll', updateButtons)
        return () => el.removeEventListener('scroll', updateButtons)
    }, [weeklyChart])

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'right' ? 400 : -400, behavior: 'smooth' })
    }

    if (weeklyChart.length === 0) return null

    return (
        <div className="w-full max-w-[1360px] mx-auto px-4 py-6">
            <div className="mb-4">
                <div className="text-xs text-muted-foreground uppercase tracking-widest">
                    Top by views this week
                </div>
                <h2 className="text-2xl font-bold">WEEKLY CHART</h2>
            </div>

            <div className="relative">
                {/* Left button */}
                {canScrollLeft && (
                    <motion.button
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white hover:bg-white/40 flex items-center justify-center shadow cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </motion.button>
                )}

                {/* Scrollable row */}
                <div
                    ref={scrollRef}
                    className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {weeklyChart.map((work, i) => (
                        <motion.div
                            key={work.id}
                            className="flex-none w-[200px]"
                            style={{ scrollSnapAlign: 'start' }}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
                        >
                            <WorkCard
                                id={work.id}
                                slug={work.slug}
                                title={work.title}
                                cover={cover(work.cover)}
                                type={work.type}
                                likes={work.likes}
                                rank={i + 1}
                                showStats
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Right button */}
                {canScrollRight && (
                    <motion.button
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white hover:bg-white/40 flex items-center justify-center shadow cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                )}
            </div>
        </div>
    )
}
