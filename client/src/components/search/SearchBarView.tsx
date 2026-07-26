import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import SearchInput from './SearchInput'
import SearchRecent from './SearchRecent'
import SearchResults from './SearchResults'

export interface SearchResult {
    id: string
    title: string
    cover: string | null
    type: 'webtoon' | 'wattpad' | 'art_label' | 'artist'
    slug?: string
    chapterSlug?: string
    genres?: string[]
    subtitle?: string
    count?: number
    verified?: boolean
    href?: string
}

export interface SearchResultsPayload {
    webcomics: SearchResult[]
    novels: SearchResult[]
    arts: SearchResult[]
    artists: SearchResult[]
}

const emptyResults: SearchResultsPayload = {
    webcomics: [],
    novels: [],
    arts: [],
    artists: [],
}

function normalizeSearchResults(data: SearchResult[] | SearchResultsPayload): SearchResultsPayload {
    if (Array.isArray(data)) {
        return {
            webcomics: data.filter((item) => item.type === 'webtoon'),
            novels: data.filter((item) => item.type === 'wattpad'),
            arts: data.filter((item) => item.type === 'art_label'),
            artists: data.filter((item) => item.type === 'artist'),
        }
    }

    return {
        webcomics: data.webcomics ?? [],
        novels: data.novels ?? [],
        arts: data.arts ?? [],
        artists: data.artists ?? [],
    }
}

export default function SearchBarView() {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResultsPayload>(emptyResults)
    const [open, setOpen] = useState(false)
    const [searching, setSearching] = useState(false)
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const resultCount =
        results.webcomics.length + results.novels.length + results.arts.length + results.artists.length

    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('recentSearches') ?? '[]')
        } catch {
            return []
        }
    })

    const addToRecent = (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) return

        const updated = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, 5)
        setRecentSearches(updated)
        localStorage.setItem('recentSearches', JSON.stringify(updated))
    }

    const clearRecent = () => {
        setRecentSearches([])
        localStorage.removeItem('recentSearches')
    }

    const resetSearch = () => {
        setQuery('')
        setResults(emptyResults)
        setOpen(false)
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setOpen(false)
                setMobileSearchOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearch = (value: string) => {
        setQuery(value)

        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        if (value.trim().length < 2) {
            setResults(emptyResults)
            setOpen(false)
            return
        }

        setSearching(true)
        timerRef.current = setTimeout(async () => {
            try {
                const response = await api.get(`/public/search?q=${encodeURIComponent(value)}`)
                setResults(normalizeSearchResults(response.data))
                setOpen(true)
            } catch {
                setResults(emptyResults)
                setOpen(true)
            } finally {
                setSearching(false)
            }
        }, 150)
    }

    const handleSelect = (item: SearchResult, onClose: () => void) => {
        addToRecent(item.title)
        navigate(item.href ?? (item.slug ? `/works/${item.slug}` : '/search'))
        resetSearch()
        onClose()
    }

    const handleSeeAll = (onClose: () => void) => {
        navigate(`/search?search=${encodeURIComponent(query)}`)
        resetSearch()
        onClose()
    }

    return (
        <div ref={searchRef} className="relative ml-2">
            <div className="md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileSearchOpen(true)}
                    aria-label="Open search"
                >
                    <Search className="h-5 w-5" />
                </Button>

                {mobileSearchOpen && (
                    <div className="fixed inset-0 z-50 flex flex-col gap-4 bg-background p-4">
                        <SearchInput
                            query={query}
                            onSearch={handleSearch}
                            onReset={resetSearch}
                            onBack={() => {
                                setMobileSearchOpen(false)
                                resetSearch()
                            }}
                            mobile
                        />

                        <div className="flex-1 overflow-y-auto">
                            {query.length < 2 ? (
                                <SearchRecent
                                    recentSearches={recentSearches}
                                    onSelect={handleSearch}
                                    onClear={clearRecent}
                                />
                            ) : (
                                <SearchResults
                                    results={results}
                                    searching={searching}
                                    query={query}
                                    onSelect={(item) =>
                                        handleSelect(item, () => setMobileSearchOpen(false))
                                    }
                                    onSeeAll={() =>
                                        handleSeeAll(() => setMobileSearchOpen(false))
                                    }
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="relative hidden w-[280px] md:block">
                <SearchInput
                    query={query}
                    onSearch={handleSearch}
                    onReset={resetSearch}
                    onFocus={() => {
                        if (resultCount > 0) setOpen(true)
                    }}
                />

                {open && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-background p-2 shadow-md">
                        <SearchResults
                            results={results}
                            searching={searching}
                            query={query}
                            onSelect={(item) => handleSelect(item, () => setOpen(false))}
                            onSeeAll={() => handleSeeAll(() => setOpen(false))}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
