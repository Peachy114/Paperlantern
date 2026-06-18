import { useState, useEffect } from 'react'
import { useComics } from '@/hooks/useComics'
import { useSearchParams } from 'react-router-dom'
import Card from '@/components/Card'
import { motion, AnimatePresence } from 'framer-motion'

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Thriller', 'Sports', 'Supernatural', 'Historical', 'Psychological',
]

// ── Shared sidebar inner content ──────────────────────────────────────────────
function GenreSidebar({
  currentGenre,
  setGenre,
  clearFilters,
  comicsCount,
}: {
  currentGenre: string | null
  setGenre: (g: string | null) => void
  clearFilters: () => void
  comicsCount: number
}) {
  return (
    <div
      className="relative bg-background/95 dark:bg-[#2a2520]/90 backdrop-blur-sm border-[2.5px] border-foreground/80 dark:border-white/15 overflow-hidden"
      style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.4)' }}
    >
      {/* Halftone */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
        }}
      />

      {/* Header bar */}
      <div className="relative z-10 px-4 py-2 bg-foreground/90 dark:bg-[#3a3530] flex items-center gap-2">
        <span
          className="text-background dark:text-white/70 text-[13px] tracking-[0.18em]"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          ◆ GENRE
        </span>
      </div>

      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-[36px] bottom-0 w-[3px] z-10"
        style={{ background: 'linear-gradient(180deg, #f59e0b, #14b8a6)' }}
      />

      <div className="relative z-10 flex flex-col gap-0.5 p-2 pl-3 ">

        {/* All button */}
        <button
          onClick={() => setGenre(null)}
          className={`flex items-center justify-between w-full px-2.5 py-[7px] text-left transition-all duration-100 border-2 ${
            !currentGenre
              ? 'bg-amber-400 border-foreground text-[#1a1a1a]'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-amber-400/10'
          }`}
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '13px',
            letterSpacing: '0.1em',
            boxShadow: !currentGenre ? '2px 2px 0 var(--foreground)' : 'none',
          }}
        >
          <span>ALL</span>
          <span className={`w-3.5 h-3.5 border-2 shrink-0 flex items-center justify-center transition-colors ${!currentGenre ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-foreground'}`}>
            {!currentGenre && (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>

        <div className="w-full h-[1.5px] bg-foreground opacity-10 my-1" />

        {/* Genre buttons */}
        {GENRES.map((g) => {
          const active = currentGenre === g
          return (
            <button
              key={g}
              onClick={() => setGenre(active ? null : g)}
              className={`flex items-center justify-between w-full px-2.5 py-[6px] text-left transition-all duration-100 border-2 ${
                active
                  ? 'bg-amber-400 border-foreground text-[#1a1a1a]'
                  : 'border-transparent text-muted-foreground/70 dark:text-white/30 hover:text-foreground hover:border-foreground/50 hover:bg-amber-400/10'
              }`}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '12px',
                letterSpacing: '0.08em',
                boxShadow: active ? '2px 2px 0 var(--foreground)' : 'none',
              }}
            >
              <span>{g.toUpperCase()}</span>
              <span className={`w-3.5 h-3.5 border-2 shrink-0 flex items-center justify-center transition-colors ${active ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-foreground'}`}>
                {active && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {currentGenre && (
        <div className="relative z-10 px-3 pb-3 pt-1">
          <button
            onClick={clearFilters}
            className="w-full py-1.5 border-[2px] border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-100 text-[11px] tracking-[0.12em]"
            style={{ fontFamily: "'Bebas Neue', sans-serif", boxShadow: '2px 2px 0 var(--foreground)' }}
          >
            X CLEAR FILTER
          </button>
        </div>
      )}

      {/* Count tag inside sidebar on mobile, outside on desktop */}
      <div className="sm:hidden relative z-10 px-3 pb-3">
        <div
          className="w-fit px-2 py-0.5 bg-foreground text-background text-[9px] tracking-[0.16em]"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {comicsCount > 0 ? `${comicsCount} SERIES` : 'NO RESULTS'}
        </div>
      </div>
    </div>
  )
}

export default function ComicsIndex() {
  const { comics, cover, isRankings } = useComics('webtoon')
  const [searchParams, setSearchParams] = useSearchParams()
  const currentGenre = searchParams.get('genre')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const PAGE_SIZE = 24
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(comics.length / PAGE_SIZE)
  const paginated = comics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { setPage(1) }, [searchParams])

  const setGenre = (g: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (g) next.set('genre', g)
    else next.delete('genre')
    setSearchParams(next)
    setDrawerOpen(false) // close drawer after picking on mobile
  }

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('genre')
    setSearchParams(next)
    setDrawerOpen(false)
  }

  const sidebarProps = { currentGenre, setGenre, clearFilters, comicsCount: comics.length }

  return (
    <div className="w-full">

      {/* ── Mobile filter bar ── */}
      <div className="sm:hidden flex items-center justify-between px-4 pt-5 pb-3 gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 border-[2px] border-foreground px-3 py-1.5 text-foreground hover:bg-foreground hover:text-background transition-colors"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '12px', letterSpacing: '0.12em', boxShadow: '2px 2px 0 var(--foreground)' }}
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
          {comics.length > 0 ? `${comics.length} SERIES` : 'NO RESULTS'}
        </div>
      </div>

      {/* ── Mobile drawer overlay ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="sm:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              className="sm:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 bg-background dark:bg-[#2a2520] rounded-t-xl border-t-2 border-x-2 border-foreground/30">
                <div className="w-10 h-1 rounded-full bg-foreground/30" />
              </div>
              <GenreSidebar {...sidebarProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop layout ── */}
      <div className="flex gap-5 py-8 px-6 w-full items-start">

        {/* Main */}
        <main className="flex-1 min-w-0">
          {comics.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
              <div
                className="border-[2.5px] border-foreground px-8 py-6 text-center bg-background/80 backdrop-blur-sm"
                style={{ boxShadow: '4px 4px 0 var(--foreground)' }}
              >
                <div className="text-4xl mb-3">📭</div>
                <p className="text-foreground tracking-[0.12em]" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px' }}>
                  NO COMICS FOUND
                </p>
                <p className="text-muted-foreground text-xs tracking-widest mt-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  TRY A DIFFERENT GENRE OR FILTER
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {paginated.map((work, i) => (
                  <Card
                    key={work.id}
                    id={work.id}
                    title={work.title}
                    cover={cover(work.cover)}
                    genres={work.genres}
                    status={work.status}
                    // views={work.views}
                    likes={work.likes}
                    rank={isRankings ? (page - 1) * PAGE_SIZE + i + 1 : undefined}
                    showStats
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-[2px] border-foreground px-3 py-1 text-foreground disabled:opacity-30 hover:bg-foreground hover:text-background transition-colors duration-100"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', boxShadow: '2px 2px 0 var(--foreground)' }}
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`border-[2px] px-3 py-1 transition-colors duration-100 ${
                        page === n
                          ? 'bg-foreground text-background border-foreground'
                          : 'border-foreground text-foreground hover:bg-amber-400/20'
                      }`}
                      style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', boxShadow: '2px 2px 0 var(--foreground)' }}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-[2px] border-foreground px-3 py-1 text-foreground disabled:opacity-30 hover:bg-foreground hover:text-background transition-colors duration-100"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', boxShadow: '2px 2px 0 var(--foreground)' }}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden sm:block w-[168px] shrink-0 sticky top-24">
          <GenreSidebar {...sidebarProps} />
          <div
            className="mt-2 ml-auto w-fit px-2 py-0.5 bg-foreground text-background text-[9px] tracking-[0.16em]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {comics.length > 0 ? `${comics.length} SERIES` : 'NO RESULTS'}
          </div>
        </aside>

      </div>
    </div>
  )
}