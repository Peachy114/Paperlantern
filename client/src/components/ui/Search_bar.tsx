import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/api/axios'
import { storageUrl } from '@/utils/storage'

interface SearchResult {
    id: number
    title: string
    cover: string | null
    type: 'webtoon' | 'wattpad'
    slug: string
    chapterSlug?: string
}

export default function Search_bar() {
    const navigate = useNavigate()

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [open, setOpen] = useState(false)
    const [searching, setSearching] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

    const searchRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Add this near your other state/refs:
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

    return (
        <div ref={searchRef} className="relative ml-2">
            {/* ── Mobile: full-screen overlay sliding from right ── */}
            <div className="md:hidden">
                <button
                    onClick={() => setMobileSearchOpen(true)}
                    className="w-[34px] h-[34px] flex items-center justify-center border-2 border-foreground text-foreground"
                    style={{ boxShadow: '2px 2px 0 var(--foreground)' }}
                    aria-label="Open search"
                >
                    <svg
                        className="w-[15px] h-[15px]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                </button>

                <AnimatePresence>
                    {mobileSearchOpen && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="fixed inset-0 z-[999] flex flex-col
                    bg-[#fffdf5] dark:bg-[#201d18]"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-foreground/10">
                                <button
                                    onClick={() => {
                                        setMobileSearchOpen(false)
                                        setQuery('')
                                        setResults([])
                                        setOpen(false)
                                    }}
                                    className="w-[34px] h-[34px] flex items-center justify-center border-2 border-foreground text-foreground shrink-0"
                                    style={{ boxShadow: '2px 2px 0 var(--foreground)' }}
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M19 12H5M12 5l-7 7 7 7" />
                                    </svg>
                                </button>

                                {/* Search input */}
                                <div
                                    className="flex-1 flex items-center gap-2 border-2 px-3 h-[38px]
                        border-foreground dark:border-[#4a4236]
                        bg-[#fffdf5] dark:bg-[#2a2620]"
                                    style={{ boxShadow: '2px 2px 0 var(--foreground)' }}
                                >
                                    <svg
                                        className="w-[14px] h-[14px] shrink-0 text-foreground/50"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    <input
                                        autoFocus
                                        type="search"
                                        value={query}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="SEARCH..."
                                        className="flex-1 h-full text-small tracking-[0.06em] bg-transparent
                                text-foreground placeholder:text-muted-foreground
                                outline-none border-none"
                                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                    />
                                    {query && (
                                        <button
                                            onClick={() => {
                                                setQuery('')
                                                setResults([])
                                                setOpen(false)
                                            }}
                                            className="text-foreground/40 hover:text-foreground shrink-0"
                                        >
                                            <svg
                                                className="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M18 6 6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto">
                                {/* Recent searches — when input is empty */}
                                {query.length < 2 && recentSearches.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 flex items-center justify-between border-b border-foreground/10">
                                            <span
                                                className="text-xsmall tracking-[0.18em] text-foreground/50"
                                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                            >
                                                RECENT SEARCHES
                                            </span>
                                            <button
                                                onClick={clearRecent}
                                                className="text-xsmall tracking-[0.12em] text-amber-500"
                                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                            >
                                                CLEAR ALL
                                            </button>
                                        </div>
                                        {recentSearches.map((term) => (
                                            <div
                                                key={term}
                                                onClick={() => handleSearch(term)}
                                                className="flex items-center gap-3 px-4 py-3 border-b border-foreground/10 last:border-b-0 active:bg-amber-400/10 transition-colors duration-100 cursor-pointer"
                                            >
                                                <svg
                                                    className="w-4 h-4 shrink-0 text-foreground/30"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M12 6v6l4 2" />
                                                </svg>
                                                <span
                                                    className="flex-1 text-sub-title tracking-[0.06em] text-foreground"
                                                    style={{
                                                        fontFamily: "'Bebas Neue', sans-serif",
                                                    }}
                                                >
                                                    {term}
                                                </span>
                                                <span className="text-foreground/30">↗</span>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Empty recent state */}
                                {query.length < 2 && recentSearches.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                                        <svg
                                            className="w-10 h-10 text-foreground/20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="m21 21-4.35-4.35" />
                                        </svg>
                                        <span
                                            className="text-small tracking-[0.12em] text-foreground/30"
                                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                        >
                                            NO RECENT SEARCHES
                                        </span>
                                    </div>
                                )}

                                {/* Results — when typing */}
                                {query.length >= 2 && (
                                    <>
                                        <div
                                            className="px-4 py-1.5 bg-foreground text-background text-xsmall tracking-[0.18em]"
                                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                        >
                                            {searching
                                                ? '— SEARCHING... —'
                                                : `— ${results.length} RESULTS —`}
                                        </div>
                                        <div>
                                            {!searching && results.length === 0 && (
                                                <div
                                                    className="px-4 py-8 text-center text-normal tracking-[0.1em] text-muted-foreground"
                                                    style={{
                                                        fontFamily: "'Bebas Neue', sans-serif",
                                                    }}
                                                >
                                                    NO RESULTS FOUND.
                                                </div>
                                            )}
                                            {!searching &&
                                                results.map((work, i) => (
                                                    <motion.div
                                                        key={work.id}
                                                        initial={{ opacity: 0, x: 8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        onClick={() => {
                                                            addToRecent(work.title)
                                                            navigate(`/comics/${work.slug}`)
                                                            setMobileSearchOpen(false)
                                                            setQuery('')
                                                            setResults([])
                                                        }}
                                                        className="flex items-center gap-4 px-4 py-3 cursor-pointer border-b border-foreground/10 last:border-b-0 active:bg-amber-400/10 transition-colors duration-100"
                                                    >
                                                        <div className="w-10 h-14 border-2 border-foreground overflow-hidden flex-none bg-muted">
                                                            {work.cover && (
                                                                <img
                                                                    src={storageUrl(work.cover)!}
                                                                    alt={work.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className="text-sub-title tracking-[0.06em] text-foreground leading-tight truncate"
                                                                style={{
                                                                    fontFamily:
                                                                        "'Bebas Neue', sans-serif",
                                                                }}
                                                            >
                                                                {work.title}
                                                            </div>
                                                            <div
                                                                className="text-xsmall tracking-[0.14em] text-amber-500 mt-1"
                                                                style={{
                                                                    fontFamily:
                                                                        "'Bebas Neue', sans-serif",
                                                                }}
                                                            >
                                                                {work.type === 'webtoon'
                                                                    ? '◆ WEBTOON'
                                                                    : '◆ NOVEL'}
                                                            </div>
                                                        </div>
                                                        <span className="text-amber-400 flex-none">
                                                            →
                                                        </span>
                                                    </motion.div>
                                                ))}
                                        </div>
                                        {!searching && results.length >= 4 && (
                                            <div
                                                onMouseDown={() => {
                                                    navigate(
                                                        `/search?search=${encodeURIComponent(query)}`
                                                    )
                                                    setMobileSearchOpen(false)
                                                }}
                                                className="px-4 py-3 border-t-2 border-foreground/10 cursor-pointer active:bg-amber-400/10 flex items-center justify-between bg-amber-400/5"
                                            >
                                                <span
                                                    className="text-xsmall tracking-[0.18em] text-amber-500"
                                                    style={{
                                                        fontFamily: "'Bebas Neue', sans-serif",
                                                    }}
                                                >
                                                    SEE ALL RESULTS FOR "{query.toUpperCase()}"
                                                </span>
                                                <span className="text-amber-500 text-xsmall">
                                                    →
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Desktop: original inline search bar ── */}
            <div className="hidden md:block relative" style={{ width: '280px' }}>
                <svg
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] pointer-events-none transition-colors duration-150 ${searchFocused ? 'text-amber-500' : 'text-foreground'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                        setSearchFocused(true)
                        results.length > 0 && setOpen(true)
                    }}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="SEARCH..."
                    className={`w-full h-[34px] pl-9 pr-3 text-small tracking-[0.06em]
                    bg-[#fffdf5] dark:bg-[#2a2620]
                    text-foreground placeholder:text-muted-foreground
                    border-2 transition-all duration-150 outline-none rounded-none
                    ${searchFocused ? 'border-amber-400' : 'border-foreground dark:border-[#4a4236]'}`}
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        boxShadow: searchFocused
                            ? '3px 3px 0 #e8a838'
                            : '2px 2px 0 var(--foreground)',
                    }}
                />
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-[42px] left-0 right-0 z-50 overflow-hidden
                bg-[#fffdf5] dark:bg-[#252118]
                border-[2.5px] border-foreground dark:border-[#3a3328]"
                            style={{
                                boxShadow: '4px 4px 0 var(--foreground)',
                                transformOrigin: 'top',
                            }}
                        >
                            <div
                                className="px-3 py-1 bg-foreground text-background text-xsmall tracking-[0.18em]"
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                }}
                            >
                                {searching ? '— SEARCHING... —' : `— ${results.length} RESULTS —`}
                            </div>
                            {!searching && results.length === 0 && (
                                <div
                                    className="px-3 py-3 text-normal tracking-[0.1em] text-muted-foreground"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                    }}
                                >
                                    NO RESULTS FOUND.
                                </div>
                            )}
                            {!searching &&
                                results.map((work, i) => (
                                    <motion.div
                                        key={work.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        onClick={() => {
                                            navigate(`/comics/${work.slug}`)
                                            setOpen(false)
                                        }}
                                        className="flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-border/20 last:border-b-0 hover:bg-amber-400/10 transition-colors duration-100"
                                    >
                                        <div className="w-8 h-11 border-2 border-foreground overflow-hidden shrink-0 bg-muted">
                                            {work.cover && (
                                                <img
                                                    src={storageUrl(work.cover)!}
                                                    alt={work.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="text-normal tracking-[0.06em] text-foreground leading-tight truncate"
                                                style={{
                                                    fontFamily: "'Bebas Neue', sans-serif",
                                                }}
                                            >
                                                {work.title}
                                            </div>
                                            <div
                                                className="text-xsmall tracking-[0.14em] text-amber-500 mt-0.5"
                                                style={{
                                                    fontFamily: "'Bebas Neue', sans-serif",
                                                }}
                                            >
                                                {work.type === 'webtoon' ? '◆ WEBTOON' : '◆ NOVEL'}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            {!searching && results.length >= 4 && (
                                <motion.div
                                    onMouseDown={() => {
                                        navigate(`/search?search=${encodeURIComponent(query)}`)
                                        setOpen(false)
                                    }}
                                    className="px-3 py-2 border-t-2 border-foreground/10 cursor-pointer hover:bg-amber-400/10 transition-colors duration-100 flex items-center justify-between"
                                >
                                    <span
                                        className="text-xsmall tracking-[0.18em] text-amber-500 truncate"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                        }}
                                    >
                                        SEE ALL RESULTS FOR "{query.toUpperCase()}"
                                    </span>
                                    <span className="text-amber-500 text-xsmall shrink-0 ml-2">
                                        →
                                    </span>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
