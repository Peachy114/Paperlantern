import { useComics } from '@/features/work/hooks/useComics'
import Card from '@/components/ui/Card'

import FilterBar from '@/components/layout/FilterBar'

export default function WattpadIndex() {
    const { comics, cover, isRankings } = useComics('wattpad')

    return (
        <div className="w-full">
            <FilterBar />

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
            </div>
        </div>
    )
}
