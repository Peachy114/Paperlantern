import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDarkMode } from '@/hooks/useDarkMode'
import { storageUrl } from '@/utils/storage'
import { motion, AnimatePresence } from 'framer-motion'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, BriefcaseBusiness, LogIn, Palette, ShoppingBag, UserPlus, X } from 'lucide-react'
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
    const { openLogin, openRegister } = useModalStore()
    const { handleLogout } = useAuth()
    const { dark, toggle } = useDarkMode()

    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)').matches : false
    )

    useEffect(() => {
        const desktopQuery = window.matchMedia('(min-width: 1280px)')

        const handleDesktopChange = (event: MediaQueryListEvent) => {
            setIsDesktop(event.matches)
            setOpen(false)
        }

        setIsDesktop(desktopQuery.matches)
        desktopQuery.addEventListener('change', handleDesktopChange)

        return () => {
            desktopQuery.removeEventListener('change', handleDesktopChange)
        }
    }, [setOpen])

    useEffect(() => {
        if (!open || isDesktop) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [open, isDesktop])

    useEffect(() => {
        if (!open) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false)
                requestAnimationFrame(() => buttonRef.current?.focus())
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [open, setOpen, buttonRef])

    const closeMenu = () => {
        setOpen(false)
        requestAnimationFrame(() => buttonRef.current?.focus())
    }

    const avatarLetter = (user?.username ?? 'G')[0].toUpperCase()
    const displayName = (user?.username ?? 'Guest').replace(/^\w/, (character) =>
        character.toUpperCase()
    )
    const displayRole = (user?.role ?? 'Wanderer').replace(/^\w/, (character) =>
        character.toUpperCase()
    )
    const isAdmin = user?.role === 'super_admin'
    const isStoryteller = user?.role === 'storyteller'
    const accountMenuStyle = user?.account_menu_style ?? 'circular'
    const profilePath = user?.username
        ? isAdmin || isStoryteller
            ? `/artists/${user.username}`
            : `/users/${user.username}`
        : null

    return (
        <>
            <div className="absolute right-0 top-full hidden pt-2 xl:block">
                <DropdownMenu
                    open={open && isDesktop}
                    onOpenChange={(nextOpen) => {
                        setOpen(nextOpen)

                        if (!nextOpen) {
                            requestAnimationFrame(() => buttonRef.current?.focus())
                        }
                    }}
                >
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-hidden="true"
                            className="pointer-events-none absolute right-0 top-0 h-0 w-0 overflow-hidden opacity-0"
                        />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        avoidCollisions
                        collisionPadding={16}
                        className={
                            isStoryteller && !isAdmin && accountMenuStyle === 'detailed'
                                ? 'w-96'
                                : 'w-80'
                        }
                    >
                        <DropdownMenuLabel className="p-1.5">
                            <ProfileIdentity
                                to={profilePath}
                                avatar={user?.avatar}
                                avatarLetter={avatarLetter}
                                displayName={displayName}
                                displayRole={displayRole}
                                onClick={closeMenu}
                            />
                        </DropdownMenuLabel>

                        {!!token && (
                            <>
                                <DropdownMenuSeparator />

                                <div className="px-2 py-2">
                                    <ProfileIconGrid
                                        isStoryteller={isStoryteller}
                                        isAdmin={isAdmin}
                                        accountMenuStyle={accountMenuStyle}
                                        onClose={closeMenu}
                                    />
                                </div>

                                <DropdownMenuSeparator />

                                <div className="px-2 py-2">
                                    <ProfileNews isStoryteller={isStoryteller} />
                                </div>

                                <DropdownMenuSeparator />

                                <ProfileLinkLists
                                    token={token}
                                    onLogout={() => {
                                        handleLogout()
                                        closeMenu()
                                    }}
                                    onClose={closeMenu}
                                    mobile
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

            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {open && !isDesktop && (
                            <motion.div
                                key="responsive-account-menu"
                                className="fixed inset-0 z-[2147483000] xl:hidden"
                            >
                                <motion.button
                                    type="button"
                                    aria-label="Close account menu"
                                    onClick={closeMenu}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                                />

                                <motion.aside
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label="Account menu"
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="absolute inset-y-0 right-0 flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl sm:w-[420px] sm:max-w-[92vw]"
                                >
                                    <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
                                        <ProfileIdentity
                                            to={profilePath}
                                            avatar={user?.avatar}
                                            avatarLetter={avatarLetter}
                                            displayName={displayName}
                                            displayRole={displayRole}
                                            onClick={closeMenu}
                                            mobile
                                        />

                                        <button
                                            type="button"
                                            onClick={closeMenu}
                                            aria-label="Close account menu"
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="min-h-0 flex-1 overflow-y-auto pb-4">
                                        {token ? (
                                            <>
                                                <div className="border-b px-4 py-4">
                                                    <ProfileIconGrid
                                                        isStoryteller={isStoryteller}
                                                        isAdmin={isAdmin}
                                                        accountMenuStyle={accountMenuStyle}
                                                        onClose={closeMenu}
                                                    />
                                                </div>

                                                <div className="border-b px-4 py-3">
                                                    <ProfileNews isStoryteller={isStoryteller} />
                                                </div>

                                                <ProfileLinkLists
                                                    token={token}
                                                    onLogout={() => {
                                                        handleLogout()
                                                        closeMenu()
                                                    }}
                                                    onClose={closeMenu}
                                                    mobile
                                                />
                                            </>
                                        ) : (
                                            <GuestAccountMenu
                                                onLogin={() => {
                                                    closeMenu()
                                                    openLogin()
                                                }}
                                                onRegister={() => {
                                                    closeMenu()
                                                    openRegister()
                                                }}
                                                onClose={closeMenu}
                                            />
                                        )}
                                    </div>

                                    <div className="border-t px-4 py-3">
                                        <ProfileToggleMode dark={dark} toggle={toggle} />
                                    </div>
                                </motion.aside>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    )
}

function ProfileIdentity({
    to,
    avatar,
    avatarLetter,
    displayName,
    displayRole,
    onClick,
    mobile = false,
}: {
    to: string | null
    avatar?: string | null
    avatarLetter: string
    displayName: string
    displayRole: string
    onClick: () => void
    mobile?: boolean
}) {
    const [avatarFailed, setAvatarFailed] = useState(false)
    const avatarUrl = avatar && !avatarFailed ? storageUrl(avatar) : null

    useEffect(() => {
        setAvatarFailed(false)
    }, [avatar])

    const content = (
        <div
            className={`flex items-center gap-3 ${
                to ? 'rounded-md transition-colors hover:bg-muted' : ''
            } ${mobile ? '' : 'p-1.5'}`}
        >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={avatarLetter}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarFailed(true)}
                    />
                ) : (
                    avatarLetter
                )}
            </div>

            <div className="min-w-0">
                <div
                    className={
                        mobile
                            ? 'truncate text-sm font-semibold'
                            : 'truncate text-base font-semibold text-foreground'
                    }
                >
                    {displayName}
                </div>

                <div className="truncate text-xs font-normal text-muted-foreground">
                    {displayRole}
                </div>
            </div>
        </div>
    )

    if (!to) return content

    return (
        <Link to={to} onClick={onClick} className="block min-w-0 outline-none">
            {content}
        </Link>
    )
}

function GuestAccountMenu({
    onLogin,
    onRegister,
    onClose,
}: {
    onLogin: () => void
    onRegister: () => void
    onClose: () => void
}) {
    const links = [
        { label: 'Browse Comix', to: '/comix', icon: BookOpen },
        { label: 'Browse Arts', to: '/explore/arts', icon: Palette },
        { label: 'Commissions', to: '/commissions', icon: BriefcaseBusiness },
        { label: 'Shop', to: '/shop', icon: ShoppingBag },
    ]

    return (
        <div className="space-y-5 px-4 py-5">
            <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-sm font-semibold">Welcome to LaterNComix</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Log in to see your profile, credits, messages, stickers, favorites, and creator
                    tools.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onLogin}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                        <LogIn className="h-4 w-4" />
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={onRegister}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-semibold transition hover:bg-muted"
                    >
                        <UserPlus className="h-4 w-4" />
                        Create
                    </button>
                </div>
            </div>

            <div className="grid gap-2">
                {links.map((item) => {
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className="flex items-center gap-3 rounded-xl border bg-background px-3 py-3 text-sm font-medium transition hover:bg-muted"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-4 w-4" />
                            </span>
                            {item.label}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
