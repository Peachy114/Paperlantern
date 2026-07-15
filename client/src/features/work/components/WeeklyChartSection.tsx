import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import weeklyChartLogo from '@/assets/icons/weekly-chart.svg'

interface Work {
    id: string
    slug: string
    title: string
    cover: string | null
    type: 'webtoon' | 'wattpad' | 'art'
    likes?: number
    description?: string | null
    genres?: string[]
    author?: string | null
}

export default function WeeklyChartSection({
    weeklyChart,
    cover,
}: {
    weeklyChart: Work[]
    cover: (path: string | null, variant?: 'sm') => string | null
}) {
    const [index, setIndex] = useState(0)

    if (weeklyChart.length === 0) return null

    const total = weeklyChart.length
    const work = weeklyChart[index]
    const image = cover(work.cover, work.type === 'art' ? undefined : 'sm')
    const bg = image
    const workHref = work.type === 'art' ? `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}` : `/works/${work.slug}`

    const goPrev = () => setIndex((i) => (i - 1 + total) % total)
    const goNext = () => setIndex((i) => (i + 1) % total)

    return (
        <section className="relative w-full h-[480px] sm:h-[500px] overflow-hidden">
            {/* Blurred backdrop */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={work.id + '-bg'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                >
                    {bg && (
                        <img
                            src={bg}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover scale-110 blur-2xl opacity-40"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="relative h-full max-w-[1360px] mx-auto px-5 flex items-center gap-5">
                <img
                    src={weeklyChartLogo}
                    alt="Weekly Chart"
                    className="absolute top-3 left-1/2 -translate-x-1/2 h-14 w-auto z-10"
                />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={work.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-5 w-full"
                    >
                        {/* Poster */}
                        <Link
                            to={workHref}
                            className="shrink-0 w-[110px] sm:w-[130px] aspect-[3/4] rounded-md overflow-hidden shadow-lg bg-muted"
                        >
                            {image && (
                                <img
                                    src={image}
                                    alt={work.title}
                                    width={130}
                                    height={174}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </Link>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <Link to={workHref}>
                                <h2 className="text-xl sm:text-3xl font-extrabold text-white leading-tight line-clamp-1 hover:underline">
                                    {work.title}
                                </h2>
                            </Link>

                            {work.genres && work.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {work.genres.slice(0, 4).map((g) => (
                                        <span
                                            key={g}
                                            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-white/15 text-white/90"
                                        >
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {work.description && (
                                <p className="text-sm text-white/70 mt-3 line-clamp-2 max-w-[600px]">
                                    {work.description}
                                </p>
                            )}

                            {work.author && (
                                <p className="text-xs text-white/50 italic mt-2">{work.author}</p>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Nav: counter + arrows */}
                <div className="absolute bottom-4 right-5 flex items-center gap-3">
                    <span className="text-xs font-bold text-white/60 tracking-widest">
                        NO.{String(index + 1).padStart(2, '0')}
                    </span>
                    <button
                        onClick={goPrev}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={goNext}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    )
}
