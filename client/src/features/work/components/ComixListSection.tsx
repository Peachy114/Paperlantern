import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useComics } from '@/features/work/hooks/useComics'
import WorkCard from '@/features/work/components/ui/WorkCard'
import ContentFilter from '../pages/ContentFilter'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 24

function Pagination({
    page,
    totalPages,
    setPage,
}: {
    page: number
    totalPages: number
    setPage: (p: number) => void
}) {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
        const delta = 2
        const range: (number | '...')[] = []
        const rangeWithDots: (number | '...')[] = []
        let l: number | undefined

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                range.push(i)
            }
        }

        for (const i of range) {
            if (l !== undefined) {
                if ((i as number) - l === 2) {
                    rangeWithDots.push(l + 1)
                } else if ((i as number) - l > 2) {
                    rangeWithDots.push('...')
                }
            }
            rangeWithDots.push(i)
            l = i as number
        }

        return rangeWithDots
    }

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-1.5 rounded text-sm bg-foreground text-background disabled:opacity-30 hover:opacity-80 transition-opacity cursor-pointer"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
            >
                ← PREV
            </button>

            {getPageNumbers().map((p, idx) =>
                p === '...' ? (
                    <span
                        key={`dots-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm"
                    >
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded text-sm transition-all cursor-pointer
                            ${
                                p === page
                                    ? 'bg-foreground text-background'
                                    : 'bg-secondary text-foreground hover:bg-muted border border-border'
                            }`}
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-1.5 rounded text-sm bg-foreground text-background disabled:opacity-30 hover:opacity-80 transition-opacity cursor-pointer"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
            >
                NEXT →
            </button>
        </div>
    )
}

function WorkListsSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="w-full aspect-[2/3] rounded-md" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                </div>
            ))}
        </div>
    )
}

function WorkLists({ type }: { type: 'webtoon' | 'wattpad' }) {
    const { comics, cover, isRankings } = useComics(type)
    const [page, setPage] = useState(1)
    const totalPages = Math.ceil(comics.length / PAGE_SIZE)
    const paginated = comics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    useEffect(() => {
        setPage(1)
    }, [comics])

    const handleSetPage = (p: number) => {
        setPage(p)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (comics.length === 0) {
        return (
            <div>
                <p className="text-foreground tracking-[0.12em] font-bebas text-[18px] sm:text-[20px]">
                    {type === 'webtoon' ? 'NO COMICS FOUND' : 'NO NOVELS FOUND'}
                </p>
                <p className="text-muted-foreground text-xs tracking-widest mt-1 font-bebas">
                    TRY A DIFFERENT GENRE OR FILTER
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {paginated.map((work, i) => (
                    <WorkCard
                        key={work.id}
                        id={work.id}
                        slug={work.slug}
                        title={work.title}
                        cover={cover(work.cover)}
                        genres={work.genres}
                        status={work.status}
                        likes={work.likes}
                        rank={isRankings ? (page - 1) * PAGE_SIZE + i + 1 : undefined}
                        boostedUntil={work.boosted_until}
                        showStats
                    />
                ))}
            </div>

            <Pagination page={page} totalPages={totalPages} setPage={handleSetPage} />
        </>
    )
}

export default function ComixLists() {
    const [searchParams] = useSearchParams()
    const activeType = searchParams.get('type') ?? 'comic'

    return (
        <div className="w-full">
            <ContentFilter />

            <main className="w-full mt-6 max-w-[1360px] mx-auto px-4">
                <Suspense fallback={<WorkListsSkeleton />}>
                    {activeType === 'novel' ? (
                        <WorkLists key="novel" type="wattpad" />
                    ) : (
                        <WorkLists key="comic" type="webtoon" />
                    )}
                </Suspense>
            </main>
        </div>
    )
}
