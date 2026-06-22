import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Laterncomix from '../ui/lanternComix'
import { useWallet } from '@/hooks/useWallet'
import Search_bar from '../ui/Search_bar'
import Profile from '../pages/Profile'
import SubNavbar from './SubNarbar'

export default function Navbar() {
    const { user, token } = useAuthStore()
    const { handleLogout } = useAuth()
    const { openLogin } = useModalStore()
    const location = useLocation()
    const { wallet } = useWallet()
    const [profileOpen, setProfileOpen] = useState(false)
    const profileButtonRef = useRef<HTMLButtonElement>(null)

    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [navbarHidden, setNavbarHidden] = useState(false)
    const [subNavVisible, setSubNavVisible] = useState(true)

    const lastScrollY = useRef(0)
    const scrollLock = useRef(false)
    const navbarHiddenRef = useRef(false)
    const subNavVisibleRef = useRef(true)
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
        setSubNavVisible(true)
        setMenuOpen(false)
    }, [location.pathname])

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
                rel="stylesheet"
            />

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
                                        className="relative px-3 py-1.5 no-underline transition-colors duration-150 group"
                                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
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
                                    className={`flex items-center gap-2 px-4 py-[5px] text-sub-title border-2 transition-colors duration-100 ${
                                        profileOpen
                                            ? 'border-[#f77c9b] text-[#f77c9b]'
                                            : 'border-foreground text-foreground'
                                    }`}
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
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
                                <div
                                    className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
                                    style={{
                                        background:
                                            'linear-gradient(90deg, #e8a838 0%, #d97706 40%, #b45309 70%, #e8a838 100%)',
                                    }}
                                />

                                <div className="px-5 py-4 flex flex-col gap-1">
                                    {[
                                        {
                                            label: 'COMICS',
                                            to: '/all-comics',
                                            active: isComicsActive,
                                        },
                                        {
                                            label: 'NOVELS',
                                            to: '/all-wattpad',
                                            active: isNovelsActive,
                                        },
                                    ].map(({ label, to, active }) => (
                                        <Link
                                            key={to}
                                            to={to}
                                            className="px-3 py-2.5 no-underline border-b border-foreground/10 last:border-b-0"
                                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                        >
                                            <span
                                                className={`text-sub-title tracking-[0.08em] ${active ? 'text-amber-500' : 'text-foreground'}`}
                                            >
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
                                            <span className="text-sub-title tracking-[0.08em] text-amber-500">
                                                CREDITS — {wallet?.balance ?? '—'}
                                            </span>
                                        </Link>
                                    )}

                                    {!!token && user?.role === 'storyteller' && (
                                        <Link
                                            to="/studio"
                                            className="px-3 py-2.5 no-underline"
                                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                        >
                                            <span className="text-sub-title tracking-[0.08em] text-[#f77c9b]">
                                                STUDIO
                                            </span>
                                        </Link>
                                    )}
                                    {!!token && user?.role === 'super_admin' && (
                                        <Link
                                            to="/admin"
                                            className="px-3 py-2.5 no-underline text-center"
                                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                        >
                                            <span className="text-normal tracking-[0.08em] text-foreground">
                                                ADMIN
                                            </span>
                                        </Link>
                                    )}
                                    {!!token && user?.role === 'wanderer' && (
                                        <Link
                                            to="/become-creator"
                                            className="px-3 py-2.5 no-underline text-center"
                                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                        >
                                            <span className="text-small tracking-[0.08em] text-foreground">
                                                BECOME CREATOR
                                            </span>
                                        </Link>
                                    )}

                                    {/* Mobile: Profile */}
                                    <div className="border-t border-foreground/10 pt-2">
                                        <Profile
                                            open={profileOpen}
                                            setOpen={setProfileOpen}
                                            buttonRef={profileButtonRef}
                                        />
                                    </div>

                                    {!!token ? (
                                        <button
                                            onClick={() => {
                                                handleLogout()
                                                setMenuOpen(false)
                                            }}
                                            className="w-full px-3 py-2.5 border-2 border-foreground text-center text-foreground hover:bg-foreground hover:text-background transition-colors duration-100 cursor-pointer text-sub-title"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.1em',
                                                boxShadow: '2px 2px 0 var(--foreground)',
                                            }}
                                        >
                                            LOGOUT
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                openLogin()
                                                setMenuOpen(false)
                                            }}
                                            className="w-full px-3 py-2.5 border-2 border-foreground text-[#1a1a1a] dark:text-[#ffffff] cursor-pointer text-sub-title text-center"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.1em',
                                                boxShadow: '2px 2px 0 var(--foreground)',
                                            }}
                                        >
                                            LOGIN
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Sub Navbar ── */}
                    <AnimatePresence>{subNavVisible && <SubNavbar />}</AnimatePresence>
                </motion.div>
            </div>
        </>
    )
}
