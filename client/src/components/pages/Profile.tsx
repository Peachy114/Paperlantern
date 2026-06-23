import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useWallet } from '@/hooks/useWallet'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEffect, useRef } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { motion, AnimatePresence } from 'framer-motion'
import studioImg from '@/assets/images/studio.png'
import admin_wanderer from '@/assets/images/admin_wanderer.png'

type ProfileProps = {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    buttonRef: React.RefObject<HTMLButtonElement | null>
}

export default function Profile({ open, setOpen, buttonRef }: ProfileProps) {
    const { user, token } = useAuthStore()
    const { handleLogout } = useAuth()
    const { wallet } = useWallet()
    const { dark, toggle } = useDarkMode()
    const profileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (window.innerWidth < 768) return
            if (
                profileRef.current &&
                !profileRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [setOpen, buttonRef])

    const menuItems = [
        ...(!!token && user?.role === 'super_admin'
            ? [{ label: 'ADMIN PANEL', to: '/admin', icon: '⬡', color: 'text-[#f77c9b]' }]
            : []),
        ...(!!token && user?.role === 'storyteller'
            ? [{ label: 'GO TO STUDIO', to: '/studio', icon: '✦', color: 'text-[#f77c9b]' }]
            : []),
        ...(!!token && user?.role === 'wanderer'
            ? [
                  {
                      label: 'BECOME CREATOR',
                      to: '/become-creator',
                      icon: '◆',
                      color: 'text-foreground',
                  },
              ]
            : []),
        ...(!!token
            ? [
                  {
                      label: 'CREDITS',
                      to: '/credits',
                      icon: '◈',
                      suffix: wallet?.balance ?? '—',
                      color: 'text-amber-500',
                  },
              ]
            : []),
    ]

    // ── Shared menu content ──
    const menuContent = (
        <>
            {menuItems.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 font-bebas hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-100 no-underline ${item.color}`}
                >
                    <span className="hidden md:inline text-[14px] opacity-60">{item.icon}</span>
                    <span className="text-[15px] md:text-[13px] tracking-[0.1em] flex-1 text-start">
                        {item.label}
                    </span>
                    {item.suffix && (
                        <span className="text-[14px] md:text-[12px] tracking-[0.08em] opacity-70">
                            {item.suffix}
                        </span>
                    )}
                    <span className="text-foreground/30">›</span>
                </Link>
            ))}

            {/* Dark mode toggle */}
            <button
                onClick={toggle}
                className="w-full flex items-center font-bebas gap-4 px-5 py-4 text-foreground hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-100"
            >
                <span className="hidden md:inline text-[14px] opacity-60">
                    {dark ? (
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                        </svg>
                    ) : (
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </span>
                <span className="text-[15px] md:text-[13px] tracking-[0.1em] flex-1 text-start">
                    {dark ? 'LIGHT MODE' : 'DARK MODE'}
                </span>
                <span className="text-foreground/30">›</span>
            </button>

            {/* Mobile-only Comics/Novels */}
            <div className="md:hidden">
                {[
                    { label: 'COMICS', to: '/all-comics' },
                    { label: 'NOVELS', to: '/all-wattpad' },
                ].map(({ label, to }) => (
                    <Link
                        key={label}
                        to={to}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-foreground/5 font-bebas dark:hover:bg-white/5 transition-colors duration-100 no-underline text-foreground dark:border-white/5"
                    >
                        <span className="text-[15px] tracking-[0.1em] flex-1 text-start">
                            {label}
                        </span>
                        <span className="text-foreground/30">›</span>
                    </Link>
                ))}
            </div>
        </>
    )

    return (
        <>
            {/* ── Desktop: dropdown ── */}
            <div ref={profileRef} className="hidden md:block w-[220px]">
                <div
                    className="relative overflow-hidden bg-[#fffdf5] dark:bg-[#201d18]
                        border-[2.5px] border-foreground dark:border-[#3a3328] rounded-xl"
                    style={{ boxShadow: '4px 4px 0 var(--foreground)' }}
                >
                    {/* Halftone bg */}
                    <div
                        className="absolute inset-0 pointer-events-none dark:hidden opacity-40"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
                            backgroundSize: '8px 8px',
                        }}
                    />
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

                    {/* User info */}
                    <div className="relative z-10 flex items-center gap-3 px-4 pt-5 pb-3 border-b-2 border-foreground/10">
                        <div className="w-9 h-9 shrink-0 border-2 border-foreground bg-muted flex items-center justify-center">
                            <span className="text-lg font-extrabold text-[#F5A623]">
                                {user?.username?.[0]?.toUpperCase() ?? '?'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0 text-start">
                            <div className="text-[15px] tracking-[0.08em] text-foreground truncate leading-tight font-bebas">
                                {user?.username ?? 'GUEST'}
                            </div>
                            <div className="text-[10px] tracking-[0.12em] text-amber-500 leading-tight font-bebas">
                                ◆ {user?.role?.toUpperCase() ?? 'WANDERER'}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 py-1">
                        {menuContent}
                        <div className="mx-4 my-1 border-t-2 border-foreground/10" />
                        {!!token && (
                            <button
                                onClick={() => {
                                    handleLogout()
                                    setOpen(false)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-100 font-bebas"
                            >
                                <span className="text-[14px] opacity-60">→</span>
                                <span className="text-[13px] tracking-[0.1em]">SIGN OUT</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Mobile: full-screen slide-in from right ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="md:hidden fixed inset-0 z-[999] flex flex-col bg-[#fffdf5] dark:bg-[#201d18]"
                    >
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_30px] gap-3 px-4 py-4 text-center items-center">
                            <span className="w-full text-[16px] tracking-[0.1em] text-foreground font-bebas">
                                MORE
                            </span>

                            <button
                                onClick={() => setOpen(false)}
                                className="w-[38px] h-[38px] flex items-center justify-center border-2 border-foreground text-foreground shrink-0"
                                style={{ boxShadow: '2px 2px 0 var(--foreground)' }}
                            >
                                <svg
                                    className="w-5 h-5"
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
                        </div>

                        {/* User info */}
                        <div className="flex items-center gap-4 px-4 py-5">
                            <div className="w-14 h-14 shrink-0 border-2 border-foreground bg-muted flex items-center justify-center">
                                <span className="text-2xl font-extrabold text-[#F5A623]">
                                    {user?.username?.[0]?.toUpperCase() ?? '?'}
                                </span>
                            </div>
                            <div>
                                <div className="text-[18px] tracking-[0.08em] text-foreground leading-tight font-bebas">
                                    {user?.username ?? 'GUEST'}
                                </div>
                                <div className="text-[11px] tracking-[0.12em] text-amber-500 leading-tight font-bebas">
                                    ◆ {user?.role?.toUpperCase() ?? 'WANDERER'}
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-3">
                            {!!token && (
                                <img
                                    src={user?.role === 'storyteller' ? studioImg : admin_wanderer}
                                    alt={user?.role === 'storyteller' ? 'Studio' : 'Profile'}
                                    className="w-full rounded-[5px] object-cover"
                                />
                            )}
                        </div>

                        {/* Menu items */}
                        <div className="flex-1 overflow-y-auto">{menuContent}</div>

                        {/* Logout */}
                        {!!token && (
                            <div className="px-4 py-4 border-t border-foreground/10">
                                <button
                                    onClick={() => {
                                        handleLogout()
                                        setOpen(false)
                                    }}
                                    className="w-full py-3 border-2 border-foreground text-foreground text-center hover:bg-foreground hover:text-background transition-colors duration-100 font-bebas"
                                    style={{
                                        letterSpacing: '0.1em',
                                        boxShadow: '2px 2px 0 var(--foreground)',
                                    }}
                                >
                                    → SIGN OUT
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
