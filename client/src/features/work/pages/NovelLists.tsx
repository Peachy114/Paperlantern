import { useComics } from '@/features/work/hooks/useComics'
import { useSearchParams } from 'react-router-dom'
import Card from '@/components/ui/Card'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GenreSidebar from '../components/GenreSidebar'

export default function WattpadIndex() {
    const { comics, cover, isRankings } = useComics('wattpad')
    const [searchParams, setSearchParams] = useSearchParams()
    const currentGenre = searchParams.get('genre')
    const [drawerOpen, setDrawerOpen] = useState(false)

    const setGenre = (g: string | null) => {
        const next = new URLSearchParams(searchParams)
        if (g) next.set('genre', g)
        else next.delete('genre')
        setSearchParams(next)
        setDrawerOpen(false)
    }

    const clearFilters = () => {
        const next = new URLSearchParams(searchParams)
        next.delete('genre')
        setSearchParams(next)
        setDrawerOpen(false)
    }

    const sidebarProps = {
        currentGenre,
        setGenre,
        clearFilters,
        comicsCount: comics.length,
        label: 'NOVELS',
    }

    return (
        <div className="w-full">
            {/* Mobile filter bar */}
            <div className="sm:hidden flex items-center justify-between px-4 pt-5 pb-3 gap-3">
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 border-[2px] border-foreground px-3 py-1.5 text-foreground hover:bg-foreground hover:text-background transition-colors"
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '12px',
                        letterSpacing: '0.12em',
                        boxShadow: '2px 2px 0 var(--foreground)',
                    }}
                >
                    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                        <rect y="0" width="14" height="2" rx="1" fill="currentColor" />
                        <rect y="5" width="10" height="2" rx="1" fill="currentColor" />
                        <rect y="10" width="6" height="2" rx="1" fill="currentColor" />
                    </svg>
                    GENRE{currentGenre ? `: ${currentGenre.toUpperCase()}` : ''}
                </button>

                <div
                    className="px-2 py-0.5 bg-foreground text-background text-[9px] tracking-[0.16em] shrink-0"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    {comics.length > 0 ? `${comics.length} NOVELS` : 'NO RESULTS'}
                </div>
            </div>

            {/* Mobile drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            className="sm:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDrawerOpen(false)}
                        />
                        <motion.div
                            className="sm:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-xl"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        >
                            <div className="flex justify-center pt-3 pb-1 bg-background dark:bg-[#2a2520] rounded-t-xl border-t-2 border-x-2 border-foreground/30">
                                <div className="w-10 h-1 rounded-full bg-foreground/30" />
                            </div>
                            <GenreSidebar {...sidebarProps} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop layout */}
            <div className="flex gap-5 py-8 px-6 w-full items-start">
                <main className="flex-1 min-w-0">
                    {comics.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
                            <div
                                className="border border-foreground/20 dark:border-white/10 px-8 py-6 text-center bg-background/60 dark:bg-white/[0.03] backdrop-blur-sm"
                                style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.15)' }}
                            >
                                <div className="text-4xl mb-3">📭</div>
                                <p
                                    className="text-foreground/80 dark:text-white/60 tracking-[0.12em]"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: '20px',
                                    }}
                                >
                                    NO NOVELS FOUND
                                </p>
                                <p
                                    className="text-muted-foreground/60 text-xs tracking-widest mt-1"
                                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                >
                                    TRY A DIFFERENT GENRE OR FILTER
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {comics.map((work, i) => (
                                <Card
                                    key={work.id}
                                    id={work.id}
                                    slug={work.slug}
                                    title={work.title}
                                    cover={cover(work.cover)}
                                    genres={work.genres}
                                    status={work.status}
                                    // views={work.views}
                                    likes={work.likes}
                                    rank={isRankings ? i + 1 : undefined}
                                    showStats
                                />
                            ))}
                        </div>
                    )}
                </main>

                {/* Desktop sidebar */}
                <aside className="hidden sm:block w-[168px] shrink-0 sticky top-24">
                    <GenreSidebar {...sidebarProps} />
                    <div
                        className="mt-2 ml-auto w-fit px-2 py-0.5 bg-foreground text-background text-[9px] tracking-[0.16em]"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        {comics.length > 0 ? `${comics.length} NOVELS` : 'NO RESULTS'}
                    </div>
                </aside>
            </div>
        </div>
    )
}
