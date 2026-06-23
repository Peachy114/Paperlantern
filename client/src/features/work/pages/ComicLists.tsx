import { useState } from 'react'
import { useComics } from '@/features/work/hooks/useComics'
import Card from '@/components/ui/Card'
import FilterBar from '@/components/layout/FilterBar'

export default function ComicsIndex() {
    const { comics, cover, isRankings } = useComics('webtoon')

    const PAGE_SIZE = 24
    const [page, setPage] = useState(1)
    const totalPages = Math.ceil(comics.length / PAGE_SIZE)
    const paginated = comics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <div className="w-full">
            <FilterBar />

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
                                <p
                                    className="text-foreground tracking-[0.12em] font-bebas"
                                    style={{
                                        fontSize: '20px',
                                    }}
                                >
                                    NO COMICS FOUND
                                </p>
                                <p className="text-muted-foreground text-xs tracking-widest mt-1 font-bebas">
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
                                        slug={work.slug}
                                        title={work.title}
                                        cover={cover(work.cover)}
                                        genres={work.genres}
                                        status={work.status}
                                        // views={work.views}
                                        likes={work.likes}
                                        rank={
                                            isRankings ? (page - 1) * PAGE_SIZE + i + 1 : undefined
                                        }
                                        showStats
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="border-[2px] font-bebas border-foreground px-3 py-1 text-foreground disabled:opacity-30 hover:bg-foreground hover:text-background transition-colors duration-100"
                                        style={{
                                            fontSize: '13px',
                                            boxShadow: '2px 2px 0 var(--foreground)',
                                        }}
                                    >
                                        ←
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                        (n) => (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                className={`border-[2px] px-3 py-1 transition-colors duration-100 font-bebas${
                                                    page === n
                                                        ? 'bg-foreground text-background border-foreground'
                                                        : 'border-foreground text-foreground hover:bg-amber-400/20'
                                                }`}
                                                style={{
                                                    fontSize: '13px',
                                                    boxShadow: '2px 2px 0 var(--foreground)',
                                                }}
                                            >
                                                {n}
                                            </button>
                                        )
                                    )}
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="border-[2px] font-bebas border-foreground px-3 py-1 text-foreground disabled:opacity-30 hover:bg-foreground hover:text-background transition-colors duration-100"
                                        style={{
                                            fontSize: '13px',
                                            boxShadow: '2px 2px 0 var(--foreground)',
                                        }}
                                    >
                                        →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
