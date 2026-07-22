import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import SearchInput from './SearchInput'
import SearchResults from './SearchResults'
import SearchRecent from './SearchRecent'

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

export default function SearchBarView() {
    const navigate = useNavigate()

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResultsPayload>(emptyResults)
    const [open, setOpen] = useState(false)
    const [searching, setSearching] = useState(false)
    const [, setSearchFocused] = useState(false)
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

    const addToRecent = (val: string) => {
        const trimmed = val.trim()
        if (!trimmed) return
        const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5)
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
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearchFocused(false)
                setMobileSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearch = (val: string) => {
        setQuery(val)
        if (timerRef.current) clearTimeout(timerRef.current)
        if (val.length < 2) {
            setResults(emptyResults)
            setOpen(false)
            return
        }
        setSearching(true)
        timerRef.current = setTimeout(async () => {
            try {
                const res = await api.get(`/public/search?q=${encodeURIComponent(val)}`)
                setResults(normalizeSearchResults(res.data))
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
            {/* Mobile */}
            <div className="md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileSearchOpen(true)}
                    aria-label="Open search"
                >
                    <Search className="w-5 h-5" />
                </Button>

                {mobileSearchOpen && (
                    <div className="fixed inset-0 z-50 bg-background flex flex-col p-4 gap-4">
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
                            {query.length < 2 && (
                                <SearchRecent
                                    recentSearches={recentSearches}
                                    onSelect={handleSearch}
                                    onClear={clearRecent}
                                />
                            )}
                            {query.length >= 2 && (
                                <SearchResults
                                    results={results}
                                    searching={searching}
                                    query={query}
                                    onSelect={(work) =>
                                        handleSelect(work, () => setMobileSearchOpen(false))
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

            {/* Desktop */}
            <div className="hidden md:block relative w-[280px]">
                <SearchInput
                    query={query}
                    onSearch={handleSearch}
                    onReset={resetSearch}
                    onFocus={() => {
                        setSearchFocused(true)
                        if (resultCount > 0) setOpen(true)
                    }}
                    onBlur={() => setSearchFocused(false)}
                />

                {open && (
                    <div className="absolute top-full mt-1 left-0 w-full z-50 bg-background border rounded-md shadow-md p-2">
                        <SearchResults
                            results={results}
                            searching={searching}
                            query={query}
                            onSelect={(work) => handleSelect(work, () => setOpen(false))}
                            onSeeAll={() => handleSeeAll(() => setOpen(false))}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
