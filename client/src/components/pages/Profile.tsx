import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useWallet } from '@/hooks/useWallet'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useState, useEffect, useRef } from 'react'

function useDarkMode() {
    const [dark, setDark] = useState(
        () =>
            document.documentElement.classList.contains('dark') ||
            (!('darkMode' in localStorage) &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)
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
    return { dark, toggle: () => setDark((d) => !d) }
}

type ProfileProps = {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    buttonRef: React.RefObject<HTMLButtonElement | null>
}

export default function Profile({ setOpen, buttonRef }: ProfileProps) {
    const { user, token } = useAuthStore()
    const { handleLogout } = useAuth()
    const { wallet } = useWallet()
    const { dark, toggle } = useDarkMode()
    const profileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node) // ← exclude the toggle button
            ) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [setOpen, buttonRef])

    const menuItems = [
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
    ]

    return (
        <div ref={profileRef} className="w-[220px]">
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

                {/* User info header */}
                <div className="relative z-10 flex items-center gap-3 px-4 pt-5 pb-3 border-b-2 border-foreground/10">
                    <div className="w-9 h-9 shrink-0 border-2 border-foreground bg-muted flex items-center justify-center">
                        <span className="text-lg font-extrabold text-[#F5A623]">
                            {user?.username?.[0]?.toUpperCase() ?? '?'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0 text-start">
                        <div
                            className="text-[15px] tracking-[0.08em] text-foreground truncate leading-tight"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            {user?.username ?? 'GUEST'}
                        </div>
                        <div
                            className="text-[10px] tracking-[0.12em] text-amber-500 leading-tight"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ◆ {user?.role?.toUpperCase() ?? 'WANDERER'}
                        </div>
                    </div>
                </div>

                {/* Menu items */}
                <div className="relative z-10 py-1">
                    {/* Dark mode toggle */}
                    <button
                        onClick={toggle}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-100"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        <span className="text-[14px] opacity-60">
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
                        <span className="w-full text-[13px] tracking-[0.1em] text-start">
                            {dark ? 'LIGHT MODE' : 'DARK MODE'}
                        </span>
                    </button>

                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.to}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-100 no-underline ${item.color}`}
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            <span className="text-[14px] opacity-60">{item.icon}</span>
                            <span className="text-[13px] tracking-[0.1em] flex-1 text-start">
                                {item.label}
                            </span>
                            {item.suffix && (
                                <span className="text-[12px] tracking-[0.08em] opacity-70">
                                    {item.suffix}
                                </span>
                            )}
                        </Link>
                    ))}

                    {/* Divider */}
                    <div className="mx-4 my-1 border-t-2 border-foreground/10" />

                    {/* Logout */}
                    {!!token && (
                        <button
                            onClick={() => {
                                handleLogout()
                                setOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-100"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            <span className="text-[14px] opacity-60">→</span>
                            <span className="text-[13px] tracking-[0.1em]">SIGN OUT</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
