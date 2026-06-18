import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { useAuth } from '@/hooks/useAuth'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/api/axios'
import { storageUrl } from '@/utils/storage'
import PaperLantern from '../ui/paperLantern'
import { useWallet } from '@/hooks/useWallet'


interface SearchResult {
  id: number
  title: string
  cover: string | null
  type: 'webtoon' | 'wattpad'
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const SUB_NAV: Record<string, { label: string; href: string }[]> = {
  '/all-comics': [
    ...DAYS.map((d) => ({ label: d, href: `/all-comics?day=${d.toLowerCase()}` })),
    { label: 'Completed', href: '/all-comics?status=completed' },
    { label: 'Rankings', href: '/all-comics?view=rankings' },
  ],
  '/all-wattpad': [
    ...DAYS.map((d) => ({ label: d, href: `/all-wattpad?day=${d.toLowerCase()}` })),
    { label: 'Completed', href: '/all-wattpad?status=completed' },
    { label: 'Rankings', href: '/all-wattpad?view=rankings' },
  ],
}

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark') ||
    (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }, [dark])
  return { dark, toggle: () => setDark(d => !d) }
}

export default function Navbar() {
  const { user, token } = useAuthStore()
  const { handleLogout } = useAuth()
  const { openLogin } = useModalStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { dark, toggle } = useDarkMode()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isChapterPage = /\/comics\/\d+\/chapters\/\d+/.test(location.pathname)
  const [subNavVisible, setSubNavVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [navbarHidden, setNavbarHidden] = useState(false)
  const lastScrollY = useRef(0)
  const scrollLock = useRef(false)
  const navbarHiddenRef = useRef(false)
  const subNavVisibleRef = useRef(true)
  const isChapterPageRef = useRef(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  // WALLET
  const { wallet } = useWallet()

  useEffect(() => {
    isChapterPageRef.current = isChapterPage
    if (!isChapterPage) {
      navbarHiddenRef.current = false
      setNavbarHidden(false)
    }
  }, [isChapterPage])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        if (scrollLock.current) return
        const current = window.scrollY
        const prev = lastScrollY.current
        const diff = current - prev
        lastScrollY.current = current
        setScrolled(current > 10)
        if (isChapterPageRef.current) {
          if (diff > 0 && current > 100 && !navbarHiddenRef.current) {
            scrollLock.current = true
            navbarHiddenRef.current = true
            setNavbarHidden(true)
            setTimeout(() => { scrollLock.current = false }, 500)
          } else if (diff < 0 && navbarHiddenRef.current) {
            scrollLock.current = true
            navbarHiddenRef.current = false
            setNavbarHidden(false)
            setTimeout(() => { scrollLock.current = false }, 500)
          }
          return
        }
        if (diff > 8 && current > 80 && subNavVisibleRef.current) {
          subNavVisibleRef.current = false
          setSubNavVisible(false)
        } else if (diff < -8 && !subNavVisibleRef.current) {
          subNavVisibleRef.current = true
          setSubNavVisible(true)
        }
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setQuery('')
    setSubNavVisible(true)
    setMenuOpen(false)
    setMobileSearchOpen(false) 
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (val: string) => {
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.length < 2) { setResults([]); setOpen(false); return }
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

  const activeSection = location.pathname.startsWith('/all-wattpad')
    ? '/all-wattpad'
    : location.pathname.startsWith('/all-comics')
    ? '/all-comics'
    : null

  const subNavItems = activeSection ? SUB_NAV[activeSection] : null

  const buildHref = (href: string) => {
    const [path, search] = href.split('?')
    const next = new URLSearchParams(search)
    const genre = new URLSearchParams(location.search).get('genre')
    if (genre) next.set('genre', genre)
    return next.toString() ? `${path}?${next.toString()}` : path
  }

  const isComicsActive = location.pathname.startsWith('/all-comics')
  const isNovelsActive = location.pathname.startsWith('/all-wattpad')

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />

      <div
        className={isChapterPage ? 'relative z-50 w-full' : 'sticky z-50 w-full'}
        style={!isChapterPage ? { top: '-2px' } : undefined}
      >
        <motion.div
          animate={{ y: navbarHidden ? '-110%' : '0%' }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {/* ── Main Navbar ── */}
          <motion.nav
            className="relative w-full overflow-visible
              bg-[#fffdf5] dark:bg-[#201d18]
              border-b-[2.5px] border-foreground dark:border-[#3a3328]
              rounded-b-xl mb-2"
            animate={{ boxShadow: scrolled ? '0 4px 0 var(--foreground)' : '0 2px 0 var(--foreground)' }}
          >
            {/* Halftone bg — light */}
            <div
              className="absolute inset-0 pointer-events-none dark:hidden opacity-60"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
              }}
            />
            {/* Halftone bg — dark: warm sepia dots, more visible */}
            <div
              className="absolute inset-0 pointer-events-none hidden dark:block"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(200,170,100,0.12) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
              }}
            />

            {/* Top accent stripe — warm amber only, no teal clash */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none "
              style={{ background: 'linear-gradient(90deg, #e8a838 0%, #d97706 40%, #b45309 70%, #e8a838 100%)' }}
            />

            <div className="relative z-10 max-w-[1126px] mx-auto px-4 h-14 flex items-center gap-3">

              {/* Logo */}
              <PaperLantern />

              {/* Panel divider — desktop only */}
              <div className="hidden md:block w-[3px] h-7 bg-foreground opacity-20 shrink-0" />

              {/* Nav links — desktop only */}
              <div className="hidden md:flex items-center gap-1">
                {[
                  { label: 'COMICS', to: '/all-comics', active: isComicsActive },
                  { label: 'NOVELS', to: '/all-wattpad', active: isNovelsActive },
                ].map(({ label, to, active }) => (
                  <Link
                    key={to}
                    to={to}
                    className="relative px-3 py-1.5 no-underline transition-colors duration-150 group"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    <span className={`text-sub-title tracking-[0.08em] leading-none transition-colors duration-150 ${active ? 'text-amber-500' : 'text-foreground'}`}>
                      {label}
                    </span>
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] bg-amber-400 transition-all duration-200 ${active ? 'w-[calc(100%-16px)]' : 'w-0 group-hover:w-[calc(100%-16px)]'}`} />
                  </Link>
                ))}
              </div>

              {/* Search */}
              <div ref={searchRef} className="relative ml-2">

                {/* ── Mobile: icon → dropdown with input inside ── */}
                <div className="md:hidden">
                  <button
                    onClick={() => {
                      setMobileSearchOpen(v => !v)
                      if (mobileSearchOpen) { setOpen(false); setQuery(''); setResults([]) }
                    }}
                    className="w-[34px] h-[34px] flex items-center justify-center border-2 border-foreground text-foreground"
                    style={{ boxShadow: '2px 2px 0 var(--foreground)' }}
                    aria-label="Open search"
                  >
                    <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </button>

                  <AnimatePresence>
                    {mobileSearchOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="fixed left-0 right-0 z-[999] mt-5 
                          bg-[#fffdf5] dark:bg-[#252118]
                          border-b-[2.5px] border-foreground dark:border-[#3a3328]"
                        style={{
                          top: searchRef.current ? searchRef.current.getBoundingClientRect().bottom + 4 : 60,
                          boxShadow: '0 4px 0 var(--foreground)',
                        }}
                      >
                        {/* Input row inside dropdown */}
                        <div className="px-3 py-2 border-b-2 border-foreground/10 flex items-center gap-2">
                          <svg className={`w-[15px] h-[15px] shrink-0 transition-colors duration-150 ${searchFocused ? 'text-amber-500' : 'text-foreground/50'}`}
                            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                          </svg>
                          <input
                            autoFocus
                            type="search"
                            value={query}
                            onChange={e => handleSearch(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            placeholder="SEARCH..."
                            className="flex-1 h-[34px] text-small tracking-[0.06em] bg-transparent
                              text-foreground placeholder:text-muted-foreground
                              outline-none border-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                          />
                          {query && (
                            <button
                              onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
                              className="text-foreground/40 hover:text-foreground shrink-0"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M18 6 6 18M6 6l12 12"/>
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Results */}
                        {query.length >= 2 && (
                          <>
                            <div className="px-4 py-1.5 bg-foreground text-background text-xsmall tracking-[0.18em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                              {searching ? '— SEARCHING... —' : `— ${results.length} RESULTS —`}
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                              {!searching && results.length === 0 && (
                                <div className="px-4 py-4 text-normal tracking-[0.1em] text-muted-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                  NO RESULTS FOUND.
                                </div>
                              )}
                              {!searching && results.map((work, i) => (
                                <motion.div
                                  key={work.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  onClick={() => { navigate(`/comics/${work.id}`); setOpen(false); setMobileSearchOpen(false); setQuery(''); setResults([]) }}
                                  className="flex items-center gap-4 px-4 py-3 cursor-pointer border-b border-foreground/10 last:border-b-0 active:bg-amber-400/10 transition-colors duration-100"
                                >
                                  <div className="w-10 h-14 border-2 border-foreground overflow-hidden flex-none bg-muted">
                                    {work.cover && <img src={storageUrl(work.cover)!} alt={work.title} className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sub-title tracking-[0.06em] text-foreground leading-tight truncate" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                      {work.title}
                                    </div>
                                    <div className="text-xsmall tracking-[0.14em] text-amber-500 mt-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                      {work.type === 'webtoon' ? '◆ WEBTOON' : '◆ NOVEL'}
                                    </div>
                                  </div>
                                  <span className="text-amber-400 flex-none">→</span>
                                </motion.div>
                              ))}
                            </div>
                            {!searching && results.length >= 4 && (
                              <div
                                onMouseDown={() => { navigate(`/search?search=${encodeURIComponent(query)}`); setOpen(false); setMobileSearchOpen(false) }}
                                className="px-4 py-3 border-t-2 border-foreground/10 cursor-pointer active:bg-amber-400/10 flex items-center justify-between bg-amber-400/5"
                              >
                                <span className="text-xsmall tracking-[0.18em] text-amber-500" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                  SEE ALL RESULTS FOR "{query.toUpperCase()}"
                                </span>
                                <span className="text-amber-500 text-xsmall">→</span>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Desktop: original inline search bar ── */}
                <div className="hidden md:block relative" style={{ width: '280px' }}>
                  <svg
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] pointer-events-none transition-colors duration-150 ${searchFocused ? 'text-amber-500' : 'text-foreground'}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="search"
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    onFocus={() => { setSearchFocused(true); results.length > 0 && setOpen(true) }}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="SEARCH..."
                    className={`w-full h-[34px] pl-9 pr-3 text-small tracking-[0.06em]
                      bg-[#fffdf5] dark:bg-[#2a2620]
                      text-foreground placeholder:text-muted-foreground
                      border-2 transition-all duration-150 outline-none rounded-none
                      ${searchFocused ? 'border-amber-400' : 'border-foreground dark:border-[#4a4236]'}`}
                    style={{ fontFamily: "'Bebas Neue', sans-serif", boxShadow: searchFocused ? '3px 3px 0 #e8a838' : '2px 2px 0 var(--foreground)' }}
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
                        style={{ boxShadow: '4px 4px 0 var(--foreground)', transformOrigin: 'top' }}
                      >
                        <div className="px-3 py-1 bg-foreground text-background text-xsmall tracking-[0.18em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                          {searching ? '— SEARCHING... —' : `— ${results.length} RESULTS —`}
                        </div>
                        {!searching && results.length === 0 && (
                          <div className="px-3 py-3 text-normal tracking-[0.1em] text-muted-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                            NO RESULTS FOUND.
                          </div>
                        )}
                        {!searching && results.map((work, i) => (
                          <motion.div
                            key={work.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => { navigate(`/comics/${work.id}`); setOpen(false) }}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-border/20 last:border-b-0 hover:bg-amber-400/10 transition-colors duration-100"
                          >
                            <div className="w-8 h-11 border-2 border-foreground overflow-hidden shrink-0 bg-muted">
                              {work.cover && <img src={storageUrl(work.cover)!} alt={work.title} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-normal tracking-[0.06em] text-foreground leading-tight truncate" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                {work.title}
                              </div>
                              <div className="text-xsmall tracking-[0.14em] text-amber-500 mt-0.5" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                {work.type === 'webtoon' ? '◆ WEBTOON' : '◆ NOVEL'}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {!searching && results.length >= 4 && (
                          <motion.div
                            onMouseDown={() => { navigate(`/search?search=${encodeURIComponent(query)}`); setOpen(false) }}
                            className="px-3 py-2 border-t-2 border-foreground/10 cursor-pointer hover:bg-amber-400/10 transition-colors duration-100 flex items-center justify-between"
                          >
                            <span className="text-xsmall tracking-[0.18em] text-amber-500 truncate" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                              SEE ALL RESULTS FOR "{query.toUpperCase()}"
                            </span>
                            <span className="text-amber-500 text-xsmall shrink-0 ml-2">→</span>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Right side */}
              <div className="ml-auto flex items-center gap-1.5">

                {!!token && (
                  <Link
                    to="/credits"
                    className="hidden md:flex items-center gap-1 px-2.5 py-[5px] border-2 border-amber-400 text-amber-500 hover:bg-amber-400 hover:text-[#1a1a1a] transition-colors duration-100"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em', boxShadow: '2px 2px 0 #d97706' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" opacity="0.3"/>
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">₵</text>
                    </svg>
                    <span className="text-small">{wallet?.balance ?? '—'}</span>
                  </Link>
                )}

                {/* Dark mode toggle */}
                <button
                  onClick={toggle}
                  aria-label="Toggle dark mode"
                  className="w-[34px] h-[34px] flex items-center justify-center border-2 border-transparent hover:border-foreground text-foreground hover:-translate-x-px hover:-translate-y-px transition-all duration-100"
                  style={{ boxShadow: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '2px 2px 0 var(--foreground)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={dark ? 'sun' : 'moon'}
                      initial={{ rotate: -30, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 30, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {dark ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="4"/>
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </button>

                {/* Desktop: role links */}
                {!!token && user?.role === 'storyteller' && (
                  <Link to="/studio" className="hidden md:block relative px-3 py-1.5 no-underline group" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    <span className="text-sub-title tracking-[0.08em] text-[#f77c9b] dark:text-white group-hover:text-amber-500 transition-colors duration-150">STUDIO</span>
                  </Link>
                )}
                {!!token && user?.role === 'super_admin' && (
                  <Link to="/admin" className="hidden md:block relative px-3 py-1.5 no-underline group" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    <span className="text-normal tracking-[0.08em] text-foreground group-hover:text-amber-500 transition-colors duration-150">ADMIN</span>
                  </Link>
                )}
                {!!token && user?.role === 'wanderer' && (
                  <Link to="/become-creator" className="hidden md:block relative px-3 py-1.5 no-underline group" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    <span className="text-small tracking-[0.08em] text-foreground group-hover:text-amber-500 transition-colors duration-150">BECOME CREATOR</span>
                  </Link>
                )}

                {/* Desktop: auth */}
                {!!token ? (
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ x: -1, y: -1 }}
                    whileTap={{ x: 1, y: 1 }}
                    className="hidden md:block px-4 py-[5px] text-sub-title border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-100 cursor-pointer"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', boxShadow: '2px 2px 0 var(--foreground)' }}
                  >
                    LOGOUT
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={openLogin}
                    whileHover={{ x: -1, y: -1 }}
                    whileTap={{ x: 1, y: 1 }}
                    className="hidden md:block relative overflow-hidden px-4 py-[5px] text-sub-title  border-2 border-foreground text-[#1a1a1a] dark:text-[#ffffff]  cursor-pointer"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', boxShadow: '3px 3px 0 var(--foreground)' }}
                  >
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                    />
                    <span className="relative z-10">LOGIN</span>
                  </motion.button>
                )}

                {/* Hamburger — mobile only */}
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="md:hidden w-[34px] h-[34px] flex flex-col items-center justify-center gap-[5px] border-2 border-foreground text-foreground transition-all duration-100 cursor-pointer"
                  style={{ boxShadow: '2px 2px 0 var(--foreground)' }}
                  aria-label="Toggle menu"
                >
                  <motion.span
                    animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block w-4 h-[2px] bg-foreground origin-center"
                  />
                  <motion.span
                    animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="block w-4 h-[2px] bg-foreground"
                  />
                  <motion.span
                    animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block w-4 h-[2px] bg-foreground origin-center"
                  />
                </button>

              </div>
            </div>
          </motion.nav>

          {/* ── Mobile Menu ── */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="md:hidden absolute top-full left-0 right-0 z-40
                  bg-[#fffdf5] dark:bg-[#201d18]
                  border-b-[2.5px] border-x-[2.5px] border-foreground dark:border-[#3a3328]"
                style={{ boxShadow: '4px 4px 0 var(--foreground)' }}
              >
                {/* Amber accent stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, #e8a838 0%, #d97706 40%, #b45309 70%, #e8a838 100%)' }}
                />

                <div className="px-5 py-4 flex flex-col gap-1">

                  {[
                    { label: 'COMICS', to: '/all-comics', active: isComicsActive },
                    { label: 'NOVELS', to: '/all-wattpad', active: isNovelsActive },
                  ].map(({ label, to, active }) => (
                    <Link
                      key={to}
                      to={to}
                      className="px-3 py-2.5 no-underline border-b border-foreground/10 last:border-b-0"
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      <span className={`text-sub-title tracking-[0.08em] ${active ? 'text-amber-500' : 'text-foreground'}`}>
                        {label}
                      </span>
                    </Link>
                  ))}

                  {!!token && (
                    <Link
                      to="/credits"
                      className="px-3 py-2.5 no-underline flex items-center justify-center border-b border-foreground/10"
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      <span className="text-sub-title tracking-[0.08em] text-amber-500">CREDITS - </span>
                      <span className="text-sub-title text-amber-500">{wallet?.balance ?? '—'}</span>
                    </Link>
                  )}

                  {!!token && user?.role === 'storyteller' && (
                    <Link to="/studio" className="px-3 py-2.5 no-underline" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      <span className="text-sub-title tracking-[0.08em] text-[#f77c9b]">STUDIO</span>
                    </Link>
                  )}
                  {!!token && user?.role === 'super_admin' && (
                    <Link to="/admin" className="px-3 py-2.5 no-underline text-center" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      <span className="text-normal tracking-[0.08em] text-foreground">ADMIN</span>
                    </Link>
                  )}
                  {!!token && user?.role === 'wanderer' && (
                    <Link to="/become-creator" className="px-3 py-2.5 no-underline text-center" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      <span className="text-small tracking-[0.08em] text-foreground">BECOME CREATOR</span>
                    </Link>
                  )}


                  {!!token ? (
                    <button
                      onClick={() => { handleLogout(); setMenuOpen(false) }}
                      className="w-full px-3 py-2.5 border-2 border-foreground text-center text-foreground hover:bg-foreground hover:text-background transition-colors duration-100 cursor-pointer text-sub-title"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', boxShadow: '2px 2px 0 var(--foreground)' }}
                    >
                      LOGOUT
                    </button>
                  ) : (
                    <button
                      onClick={() => { openLogin(); setMenuOpen(false) }}
                      className="w-full px-3 py-2.5 border-2 border-foreground text-[#1a1a1a] dark:text-[#ffffff] cursor-pointer text-sub-title text-center"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', boxShadow: '2px 2px 0 var(--foreground)' }}
                    >
                      LOGIN
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Sub Navbar ── */}
          {subNavItems && subNavVisible && (
            <motion.div
              key="sub-nav"
              initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative mt-1 overflow-hidden
                bg-[#fef3c7] dark:bg-[#272318]
                border-[2.5px] border-foreground dark:border-[#3a3328]"
              style={{
                boxShadow: '3px 3px 0 var(--foreground)',
                transformOrigin: 'top',
                backgroundImage: 'radial-gradient(circle, rgba(180,160,120,0.06) 1.5px, transparent 1.5px)',
                backgroundSize: '10px 10px',
              }}
            >
              {/* Single amber left accent — no teal */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

              <div className="max-w-[1126px] mx-auto px-5 h-10 flex items-center gap-1 overflow-x-auto">
                {subNavItems.map((item) => {
                  const isCurrentLink = location.pathname + location.search === buildHref(item.href)
                  return (
                    <Link
                      key={item.href}
                      to={buildHref(item.href)}
                      className="relative shrink-0 whitespace-nowrap px-3 py-0.5 transition-all duration-100 no-underline text-normal"
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: '0.1em',
                        color: isCurrentLink ? '#1a1a1a' : 'var(--foreground)',
                        background: isCurrentLink ? '#f59e0b' : 'transparent',
                        border: isCurrentLink ? '2px solid #1a1a1a' : '2px solid transparent',
                        boxShadow: isCurrentLink ? '2px 2px 0 #1a1a1a' : 'none',
                        fontWeight: isCurrentLink ? 800 : 600,
                      }}
                      onMouseEnter={e => {
                        if (!isCurrentLink) {
                          e.currentTarget.style.color = '#1a1a1a'
                          e.currentTarget.style.background = '#fbbf24'
                          e.currentTarget.style.border = '2px solid #1a1a1a'
                          e.currentTarget.style.boxShadow = '2px 2px 0 #1a1a1a'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isCurrentLink) {
                          e.currentTarget.style.color = 'var(--foreground)'
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.border = '2px solid transparent'
                          e.currentTarget.style.boxShadow = 'none'
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </>
  )
}