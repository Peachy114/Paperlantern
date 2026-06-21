import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnnouncements } from '@/hooks/usePublicNews'
import { storageUrl } from '@/utils/storage'

export default function News({ audience }: { audience: 'public' | 'studio' }) {
    const { announcements, loading, error } = useAnnouncements(audience)
    const [current, setCurrent] = useState(0)

    if (loading) return <div>...</div>
    if (error || !announcements.length) return null

    // Pinned first, then rest in order
    const sorted = [
        ...announcements.filter((a) => a.is_pinned),
        ...announcements.filter((a) => !a.is_pinned),
    ]

    const pinned = sorted[current]
    const total = sorted.length

    const prev = () => setCurrent((i) => (i - 1 + total) % total)
    const next = () => setCurrent((i) => (i + 1) % total)

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
                rel="stylesheet"
            />

            <div className="mb-14">
                <div className="w-full">
                    {/* Newspaper header */}
                    <div
                        className="w-full bg-[#1a1a1a] dark:bg-[#0a0a0a] px-4 sm:px-6 py-3 flex items-center justify-between border-t border-gray-800"
                        style={{ boxShadow: '4px 4px 0 var(--foreground)' }}
                    >
                        <span
                            className="text-amber-400 text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.3em]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ◆ LATER N COMIX TIMES
                        </span>
                        <div className="flex items-center gap-3">
                            {/* Carousel dots */}
                            {total > 1 && (
                                <div className="flex items-center gap-1.5">
                                    {sorted.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrent(i)}
                                            className="transition-all duration-200 rounded-full cursor-pointer"
                                            style={{
                                                width: i === current ? '16px' : '5px',
                                                height: '5px',
                                                background:
                                                    i === current
                                                        ? '#fbbf24'
                                                        : 'rgba(255,255,255,0.25)',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            <span
                                className="text-white/30 text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                {total > 1 ? `${current + 1} / ${total}` : 'VOL. 01 · ISSUE 00'}
                            </span>
                        </div>
                    </div>

                    {/* Main card */}
                    <div
                        className="relative border-[2.5px] border-t-0 border-[#1a1a1a] dark:border-foreground/40 bg-[#fffdf5] dark:bg-[#1c1a17] overflow-hidden"
                        style={{ boxShadow: '4px 4px 0 var(--foreground)' }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pinned.id}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className="flex flex-col sm:flex-row"
                            >
                                {/* Image */}
                                {storageUrl(pinned.image) && (
                                    <div className="w-full h-56 sm:w-48 sm:h-auto shrink-0 border-b-[2px] sm:border-b-0 sm:border-r-[2px] border-[#1a1a1a] dark:border-foreground/20 overflow-hidden">
                                        <img
                                            src={storageUrl(pinned.image)!}
                                            alt={pinned.title}
                                            className="w-full h-full object-cover object-center"
                                            style={{ filter: 'sepia(0.15) contrast(1.05)' }}
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 relative">
                                    <div className="hidden sm:block absolute left-12 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-500/20 pointer-events-none z-10" />
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute left-0 right-0 border-b border-blue-200/20 dark:border-blue-400/10 pointer-events-none"
                                            style={{ top: `${48 + i * 32}px` }}
                                        />
                                    ))}

                                    <div className="relative z-10 pl-4 sm:pl-16 pr-4 sm:pr-6 py-6 sm:py-8">
                                        {/* Tag */}
                                        <div
                                            className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 sm:px-3 py-1.5 sm:py-2 rotate-[2deg] z-20"
                                            style={{
                                                background:
                                                    pinned.tag === 'event'
                                                        ? '#86efac'
                                                        : pinned.tag === 'reminder'
                                                          ? '#fca5a5'
                                                          : '#fef08a',
                                                fontFamily: "'Kalam', cursive",
                                                fontSize: '10px',
                                                color: '#1a1a1a',
                                                boxShadow: '2px 3px 6px rgba(0,0,0,0.15)',
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {pinned.tag === 'event'
                                                ? '🎉 event'
                                                : pinned.tag === 'reminder'
                                                  ? '🔔 reminder'
                                                  : '📢 update'}
                                        </div>

                                        {/* Eyebrow */}
                                        <div
                                            className="text-amber-500 mb-2 text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.25em]"
                                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                        >
                                            ◆{' '}
                                            {pinned.is_pinned
                                                ? 'PINNED ANNOUNCEMENT'
                                                : 'LATEST NEWS'}
                                        </div>

                                        {/* Headline */}
                                        <h1
                                            className="text-foreground leading-none mb-3 sm:mb-4 pr-20 sm:pr-0"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                fontSize: 'clamp(22px, 6vw, 44px)',
                                                letterSpacing: '0.03em',
                                                lineHeight: 1.05,
                                            }}
                                        >
                                            {pinned.title}
                                        </h1>

                                        {/* Divider */}
                                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                            <div className="h-[2px] w-8 bg-amber-400" />
                                            <div className="h-[2px] flex-1 bg-foreground/10" />
                                        </div>

                                        {/* Body */}
                                        <p
                                            className="text-foreground/70 leading-relaxed mb-4 sm:mb-6"
                                            style={{
                                                fontFamily: "'Noto Serif', serif",
                                                fontSize: 'clamp(12px, 3vw, 14px)',
                                            }}
                                        >
                                            {pinned.content}
                                        </p>

                                        {/* Byline */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-foreground/10">
                                            <div
                                                className="px-2 py-1 bg-[#1a1a1a] dark:bg-foreground/90 text-white dark:text-background shrink-0"
                                                style={{
                                                    fontFamily: "'Bebas Neue', sans-serif",
                                                    fontSize: '10px',
                                                    letterSpacing: '0.2em',
                                                }}
                                            >
                                                {pinned.creator?.name?.toUpperCase() ?? 'STAFF'}
                                            </div>
                                            <span
                                                className="text-muted-foreground"
                                                style={{
                                                    fontFamily: "'Kalam', cursive",
                                                    fontSize: 'clamp(10px, 2.5vw, 12px)',
                                                }}
                                            >
                                                Later N Comix Editorial ·{' '}
                                                {new Date(pinned.created_at).toLocaleDateString(
                                                    'en-US',
                                                    {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    }
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Prev / Next arrows — only shown when there's more than one */}
                        {total > 1 && (
                            <>
                                <button
                                    onClick={prev}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 flex items-center justify-center bg-[#1a1a1a]/70 hover:bg-[#1a1a1a] text-white transition-colors cursor-pointer"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: '14px',
                                    }}
                                    aria-label="Previous announcement"
                                >
                                    ‹
                                </button>
                                <button
                                    onClick={next}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 flex items-center justify-center bg-[#1a1a1a]/70 hover:bg-[#1a1a1a] text-white transition-colors cursor-pointer"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: '14px',
                                    }}
                                    aria-label="Next announcement"
                                >
                                    ›
                                </button>
                            </>
                        )}
                    </div>

                    {/* Bottom label */}
                    <div className="flex items-center justify-between mt-3 px-1">
                        <span
                            className="text-muted-foreground/40 text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            LATER N COMIX PUBLISHING
                        </span>
                        <span
                            className="text-muted-foreground/40 text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ALL RIGHTS RESERVED
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
