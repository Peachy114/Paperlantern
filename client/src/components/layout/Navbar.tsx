import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Laterncomix from '../ui/lanternComix'
import Search_bar from '../ui/Search_bar'
import Profile from '../pages/Profile'

export default function Navbar() {
    const { user, token } = useAuthStore()
    const { openLogin } = useModalStore()
    const location = useLocation()
    const [profileOpen, setProfileOpen] = useState(false)
    const profileButtonRef = useRef<HTMLButtonElement>(null)

    const [scrolled, setScrolled] = useState(false)
    const [navbarHidden, setNavbarHidden] = useState(false)

    const lastScrollY = useRef(0)
    const scrollLock = useRef(false)
    const navbarHiddenRef = useRef(false)
    const isChapterPageRef = useRef(false)

    const isChapterPage = /\/comics\/\d+\/chapters\/\d+/.test(location.pathname)
    const isComicsActive = location.pathname.startsWith('/all-comics')
    const isNovelsActive = location.pathname.startsWith('/all-wattpad')

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
                        setTimeout(() => {
                            scrollLock.current = false
                        }, 500)
                    } else if (diff < 0 && navbarHiddenRef.current) {
                        scrollLock.current = true
                        navbarHiddenRef.current = false
                        setNavbarHidden(false)
                        setTimeout(() => {
                            scrollLock.current = false
                        }, 500)
                    }
                    return
                }
            })
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
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
                    animate={{
                        boxShadow: scrolled
                            ? '0 4px 0 var(--foreground)'
                            : '0 2px 0 var(--foreground)',
                    }}
                >
                    {/* Halftone bg — light */}
                    <div
                        className="absolute inset-0 pointer-events-none dark:hidden opacity-60"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
                            backgroundSize: '8px 8px',
                        }}
                    />
                    {/* Halftone bg — dark */}
                    <div
                        className="absolute inset-0 pointer-events-none hidden dark:block"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle, rgba(200,170,100,0.12) 1px, transparent 1px)',
                            backgroundSize: '8px 8px',
                        }}
                    />
                    {/* Amber top stripe */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none"
                        style={{
                            background:
                                'linear-gradient(90deg, #e8a838 0%, #d97706 40%, #b45309 70%, #e8a838 100%)',
                        }}
                    />

                    {/* LINKSSSSSSSSSSSSSSSSSSSSS============================================ */}

                    <div className="relative z-10 max-w-[1126px] mx-auto px-4 h-14 flex items-center gap-3">
                        {/* Logo */}
                        <Laterncomix />

                        {/* Divider */}
                        <div className="hidden md:block w-[3px] h-7 bg-foreground opacity-20 shrink-0" />

                        {/* Nav links — desktop */}
                        <div className="hidden md:flex items-center gap-1">
                            {[
                                { label: 'COMICS', to: '/all-comics', active: isComicsActive },
                                { label: 'NOVELS', to: '/all-wattpad', active: isNovelsActive },
                            ].map(({ label, to, active }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="relative px-3 py-1.5 no-underline transition-colors duration-150 group font-bebas"
                                >
                                    <span
                                        className={`text-sub-title tracking-[0.08em] leading-none transition-colors duration-150 ${active ? 'text-amber-500' : 'text-foreground'}`}
                                    >
                                        {label}
                                    </span>
                                    <span
                                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] bg-amber-400 transition-all duration-200 ${active ? 'w-[calc(100%-16px)]' : 'w-0 group-hover:w-[calc(100%-16px)]'}`}
                                    />
                                </Link>
                            ))}
                        </div>

                        {/* PROFILE AND SEARCH BAR */}
                        <div className="relative ml-auto flex items-center gap-5">
                            {/* Search bar */}
                            <Search_bar />

                            <button
                                ref={profileButtonRef}
                                onClick={() => {
                                    if (!token) {
                                        openLogin()
                                    } else {
                                        setProfileOpen(!profileOpen)
                                    }
                                }}
                                className={`flex items-center gap-2 px-4 py-[5px] text-sub-title border-2 transition-colors duration-100 font-bebas ${
                                    profileOpen
                                        ? 'border-[#f77c9b] text-[#f77c9b]'
                                        : 'border-foreground text-foreground'
                                }`}
                                style={{
                                    letterSpacing: '0.1em',
                                    boxShadow: profileOpen
                                        ? '2px 2px 0 #f77c9b'
                                        : '2px 2px 0 var(--foreground)',
                                }}
                            >
                                {token ? (user?.username?.toUpperCase() ?? 'PROFILE') : 'LOGIN'}
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 top-full mt-2 z-50"
                                    >
                                        <Profile
                                            open={profileOpen}
                                            setOpen={setProfileOpen}
                                            buttonRef={profileButtonRef}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.nav>
            </motion.div>
        </div>
    )
}
