import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '@/api/axios'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { storageUrl } from '@/utils/storage'

interface SearchItem {
    id: string
    title: string
    cover: string | null
    type: 'webtoon' | 'wattpad' | 'art_label' | 'artist'
    slug?: string
    genres?: string[]
    subtitle?: string
    count?: number
    verified?: boolean
    href?: string
}

interface SearchPayload {
    webcomics: SearchItem[]
    novels: SearchItem[]
    arts: SearchItem[]
    artists: SearchItem[]
}

const emptyResults: SearchPayload = {
    webcomics: [],
    novels: [],
    arts: [],
    artists: [],
}

function normalizeSearchResults(data: SearchItem[] | SearchPayload): SearchPayload {
    if (Array.isArray(data)) {
        return {
            webcomics: data.filter((item) => item.type === 'webtoon'),
            novels: data.filter((item) => item.type === 'wattpad'),
            arts: [],
            artists: [],
        }
    }

    return {
        webcomics: data.webcomics ?? [],
        novels: data.novels ?? [],
        arts: data.arts ?? [],
        artists: data.artists ?? [],
    }
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

    const [results, setResults] = useState<SearchPayload>(emptyResults)
    const [loading, setLoading] = useState(false)
    const sections = [
        { title: 'Webcomics', items: results.webcomics },
        { title: 'Novels', items: results.novels },
        { title: 'Arts', items: results.arts },
        { title: 'Artist', items: results.artists },
    ].filter((section) => section.items.length > 0)
    const total = sections.reduce((sum, section) => sum + section.items.length, 0)

    useEffect(() => {
        if (query.length < 2) {
            setResults(emptyResults)
            return
        }
        setLoading(true)
        api.get(`/public/search?q=${encodeURIComponent(query)}`)
            .then((res) => setResults(normalizeSearchResults(res.data)))
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
                        {total} result{total !== 1 ? 's' : ''} found
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
            ) : total === 0 ? (
                <p className="text-muted-foreground text-sm">No results found for "{query}".</p>
            ) : (
                <div className="space-y-10">
                    {sections.map((section) => (
                        <section key={section.title}>
                            <h2 className="mb-4 border-b pb-2 text-sm font-bold uppercase tracking-widest">
                                {section.title}
                            </h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {section.items.map((item) => (
                                    <Link
                                        key={`${section.title}-${item.id}`}
                                        to={item.href ?? (item.slug ? `/works/${item.slug}` : '/search')}
                                        className="flex items-center gap-3 rounded-lg border bg-background p-3 transition hover:bg-muted"
                                    >
                                        {item.cover ? (
                                            <SearchThumb item={item} />
                                        ) : (
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-lg font-bold uppercase text-muted-foreground">
                                                {item.type === 'art_label' ? '#' : item.title[0] ?? '?'}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {item.title}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {labelFor(item)}
                                                </Badge>
                                                {item.count !== undefined && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.count} post{item.count === 1 ? '' : 's'}
                                                    </span>
                                                )}
                                            </div>
                                            {(item.subtitle || item.genres?.length) && (
                                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                                    {item.subtitle ?? item.genres?.slice(0, 2).join(' - ')}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    )
}

function SearchThumb({ item }: { item: SearchItem }) {
    const fallback = item.cover ? storageUrl(item.cover) : null
    const [src, setSrc] = useState(item.cover ? storageUrl(item.cover, 'sm') : null)
    const [failed, setFailed] = useState(false)

    if (!src || failed) {
        return (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-lg font-bold uppercase text-muted-foreground">
                {item.type === 'art_label' ? '#' : item.title[0] ?? '?'}
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={item.title}
            className="h-16 w-16 shrink-0 rounded-md object-cover"
            onError={() => {
                if (fallback && src !== fallback) {
                    setSrc(fallback)
                } else {
                    setFailed(true)
                }
            }}
        />
    )
}

function labelFor(item: SearchItem) {
    if (item.type === 'webtoon') return 'WEBTOON'
    if (item.type === 'wattpad') return 'NOVEL'
    if (item.type === 'art_label') return 'ART LABEL'
    return item.verified ? 'VERIFIED ARTIST' : 'ARTIST'
}
