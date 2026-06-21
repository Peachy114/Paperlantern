// ── Shared sidebar inner content ──────────────────────────────────────────────

const GENRES = [
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Thriller',
    'Sports',
    'Supernatural',
    'Historical',
    'Psychological',
]

export default function GenreSidebar({
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
                    backgroundImage:
                        'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
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
                    <span
                        className={`w-3.5 h-3.5 border-2 shrink-0 flex items-center justify-center transition-colors ${!currentGenre ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-foreground'}`}
                    >
                        {!currentGenre && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                <path
                                    d="M1 3L3 5L7 1"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
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
                            <span
                                className={`w-3.5 h-3.5 border-2 shrink-0 flex items-center justify-center transition-colors ${active ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-foreground'}`}
                            >
                                {active && (
                                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                        <path
                                            d="M1 3L3 5L7 1"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
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
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            boxShadow: '2px 2px 0 var(--foreground)',
                        }}
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
