import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '@/api/axios'
import WorkCard from '@/features/work/components/ui/WorkCard'
import { Skeleton } from '@/components/ui/skeleton'

interface Work {
    id: string
    title: string
    cover: string | null
    type: 'webtoon' | 'wattpad'
    genres: string[]
}

function CardSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    )
}

export default function SearchWork() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('search') ?? ''

    const [results, setResults] = useState<Work[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }
        setLoading(true)
        api.get(`/public/search?q=${encodeURIComponent(query)}`)
            .then((res) => setResults(res.data))
            .finally(() => setLoading(false))
    }, [query])

    return (
        <div className="max-w-[1126px] mx-auto px-4 py-10">
            <div className="mb-8">
                <p
                    className="text-xs text-muted-foreground tracking-[0.2em] mb-1"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    SEARCH RESULTS
                </p>
                <h1
                    className="text-3xl font-bold tracking-wide"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    "{query.toUpperCase()}"
                </h1>
                {!loading && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {results.length} result{results.length !== 1 ? 's' : ''} found
                    </p>
                )}
            </div>

            {query.length < 2 ? (
                <p className="text-muted-foreground text-sm">
                    Type at least 2 characters to search.
                </p>
            ) : loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <p className="text-muted-foreground text-sm">No results found for "{query}".</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {results.map((work) => (
                        <WorkCard
                            key={work.id}
                            id={work.id}
                            title={work.title}
                            cover={work.cover}
                            type={work.type}
                            genres={work.genres}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
