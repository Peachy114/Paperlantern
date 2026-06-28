import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useWallet } from '@/hooks/useWallet'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDarkMode } from '@/hooks/useDarkMode'
import { motion, AnimatePresence } from 'framer-motion'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { X } from 'lucide-react'
import ProfileIconGrid from './ProfileIconGrid'
import ProfileNews from './ProfileNews'
import ProfileLinkLists from './ProfileLinkLists'
import ProfileToggleMode from './ProfileToggleMode'

type ProfileProps = {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    buttonRef: React.RefObject<HTMLButtonElement | null>
}

export default function ProfileView({ open, setOpen, buttonRef }: ProfileProps) {
    const { user, token } = useAuthStore()
    const { handleLogout } = useAuth()
    const { wallet } = useWallet()
    const { dark, toggle } = useDarkMode()
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

    useEffect(() => {
        const handler = () => setIsDesktop(window.innerWidth >= 768)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    const avatarLetter = (user?.username ?? 'G')[0].toUpperCase()
    const displayName = (user?.username ?? 'Guest').replace(/^\w/, (c) => c.toUpperCase())
    const displayRole = (user?.role ?? 'Wanderer').replace(/^\w/, (c) => c.toUpperCase())
    const isAdmin = user?.role === 'super_admin'
    const isStoryteller = user?.role === 'storyteller'

    return (
        <>
            {/* ── Desktop dropdown ── */}
            <div className="hidden md:block absolute right-0 top-9">
                <DropdownMenu open={open && isDesktop} onOpenChange={setOpen}>
                    <DropdownMenuTrigger
                        ref={buttonRef}
                        className="outline-none hidden md:block w-0 h-0"
                    />
                    <DropdownMenuContent
                        align="end"
                        avoidCollisions
                        collisionPadding={16}
                        className="w-80"
                    >
                        {/* Avatar + name */}
                        <DropdownMenuLabel className="flex gap-3 items-center">
                            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={avatarLetter}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    avatarLetter
                                )}
                            </div>
                            <div>
                                <div className="text-base font-semibold text-foreground">
                                    {displayName}
                                </div>
                                <div className="text-xs text-muted-foreground font-normal">
                                    {displayRole}
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        {!!token && (
                            <>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-2">
                                    <ProfileIconGrid
                                        isStoryteller={isStoryteller}
                                        isAdmin={isAdmin}
                                        onClose={() => setOpen(false)}
                                    />
                                </div>

                                <DropdownMenuSeparator />
                                <div className="px-2 py-2">
                                    <ProfileNews isStoryteller={isStoryteller} />
                                </div>

                                <DropdownMenuSeparator />
                                <ProfileLinkLists
                                    token={token}
                                    walletBalance={wallet?.balance}
                                    onLogout={handleLogout}
                                    onClose={() => setOpen(false)}
                                />
                            </>
                        )}

                        <DropdownMenuSeparator />
                        <div className="px-2 py-2">
                            <ProfileToggleMode dark={dark} toggle={toggle} />
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* ── Mobile slide-in ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="block md:hidden fixed inset-0 z-50 flex flex-col bg-background"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                                    {user?.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={avatarLetter}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        avatarLetter
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{displayName}</p>
                                    <p className="text-xs text-muted-foreground">{displayRole}</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {!!token && (
                                <>
                                    <div className="px-4 py-4 border-b">
                                        <ProfileIconGrid
                                            isStoryteller={isStoryteller}
                                            isAdmin={isAdmin}
                                            onClose={() => setOpen(false)}
                                        />
                                    </div>

                                    <div className="px-4 py-3 border-b">
                                        <ProfileNews isStoryteller={isStoryteller} />
                                    </div>

                                    <ProfileLinkLists
                                        token={token}
                                        walletBalance={wallet?.balance}
                                        onLogout={() => {
                                            handleLogout()
                                            setOpen(false)
                                        }}
                                        onClose={() => setOpen(false)}
                                        mobile
                                    />
                                </>
                            )}
                        </div>

                        <div className="px-4 py-3 border-t">
                            <ProfileToggleMode dark={dark} toggle={toggle} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
