import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import SearchInput from './SearchInput'
import SearchResults from './SearchResults'
import SearchRecent from './SearchRecent'

export interface SearchResult {
    id: number
    title: string
    cover: string | null
    type: 'webtoon' | 'wattpad'
    slug: string
    chapterSlug?: string
}

export default function SearchBarView() {
    const navigate = useNavigate()

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [open, setOpen] = useState(false)
    const [searching, setSearching] = useState(false)
    const [, setSearchFocused] = useState(false)
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

    const searchRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        setResults([])
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
            setResults([])
            setOpen(false)
            return
        }
        setSearching(true)
        timerRef.current = setTimeout(async () => {
            try {
                const res = await api.get(`/public/search?q=${encodeURIComponent(val)}`)
                setResults(res.data)
                setOpen(true)
            } finally {
                setSearching(false)
            }
        }, 150)
    }

    const handleSelect = (work: SearchResult, onClose: () => void) => {
        addToRecent(work.title)
        navigate(`/works/${work.slug}`)
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

                <AnimatePresence>
                    {mobileSearchOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="fixed inset-0 z-50 bg-background flex flex-col p-4 gap-4"
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop */}
            <div className="hidden md:block relative w-[280px]">
                <SearchInput
                    query={query}
                    onSearch={handleSearch}
                    onReset={resetSearch}
                    onFocus={() => {
                        setSearchFocused(true)
                        if (results.length > 0) setOpen(true)
                    }}
                    onBlur={() => setSearchFocused(false)}
                />

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="absolute top-full mt-1 left-0 w-full z-50 bg-background border rounded-md shadow-md p-2"
                        >
                            <SearchResults
                                results={results}
                                searching={searching}
                                query={query}
                                onSelect={(work) => handleSelect(work, () => setOpen(false))}
                                onSeeAll={() => handleSeeAll(() => setOpen(false))}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
