// import {
//     lazy,
//     Suspense,
//     useEffect,
//     useState,
//     type Dispatch,
//     type RefObject,
//     type SetStateAction,
// } from 'react'
// import { Link, useLocation } from 'react-router-dom'
// import { Menu, X } from 'lucide-react'

// import { Button } from '@/components/ui/button'
// import SearchBar from '@/components/search/SearchBar'
// import ThemedLogo from '@/components/layout/ThemedLogo'
// import NotificationCenter from '@/components/notifications/NotificationCenter'
// import type { User } from '@/store/authStore'
// import { storageUrl } from '@/utils/storage'

// const Profile = lazy(() => import('@/components/profile/Profile'))

// interface NavbarViewProps {
//     user: User | null
//     token: string | null
//     isChapterPage: boolean
//     isComicsActive: boolean
//     isDailyActive: boolean
//     isNovelsActive: boolean
//     isArtsActive: boolean
//     isCommissionsActive: boolean
//     isShopActive: boolean
//     navbarHidden: boolean
//     profileOpen: boolean
//     notificationOpen: boolean
//     profileButtonRef: RefObject<HTMLButtonElement | null>
//     notificationButtonRef: RefObject<HTMLButtonElement | null>
//     onProfileClick: () => void
//     onNotificationClick: () => void
//     setProfileOpen: Dispatch<SetStateAction<boolean>>
//     setNotificationOpen: Dispatch<SetStateAction<boolean>>
// }

// export default function NavbarView({
//     user,
//     token,
//     isChapterPage,
//     isDailyActive,
//     isComicsActive,
//     isNovelsActive,
//     isArtsActive,
//     isCommissionsActive,
//     isShopActive,
//     navbarHidden,
//     profileOpen,
//     notificationOpen,
//     profileButtonRef,
//     notificationButtonRef,
//     onProfileClick,
//     onNotificationClick,
//     setProfileOpen,
//     setNotificationOpen,
// }: NavbarViewProps) {
//     const location = useLocation()
//     const [navigationOpen, setNavigationOpen] = useState(false)

//     const navLinks = [
//         { label: 'DAILY', to: '/daily', active: isDailyActive },
//         { label: 'COMIX', to: '/comix', active: isComicsActive },
//         { label: 'NOVELS', to: '/novels', active: isNovelsActive },
//         { label: 'ARTS', to: '/explore/arts', active: isArtsActive },
//         { label: 'COMMISSION', to: '/commissions', active: isCommissionsActive },
//         { label: 'SHOP', to: '/shop', active: isShopActive },
//     ]

//     useEffect(() => {
//         setNavigationOpen(false)
//     }, [location.pathname])

//     useEffect(() => {
//         if (!navigationOpen) return
//         const previousOverflow = document.body.style.overflow
//         const handleKeyDown = (event: KeyboardEvent) => {
//             if (event.key === 'Escape') setNavigationOpen(false)
//         }
//         document.body.style.overflow = 'hidden'
//         window.addEventListener('keydown', handleKeyDown)
//         return () => {
//             document.body.style.overflow = previousOverflow
//             window.removeEventListener('keydown', handleKeyDown)
//         }
//     }, [navigationOpen])

//     useEffect(() => {
//         const desktopQuery = window.matchMedia('(min-width: 1280px)')
//         const handleDesktopChange = (event: MediaQueryListEvent) => {
//             if (event.matches) setNavigationOpen(false)
//         }
//         desktopQuery.addEventListener('change', handleDesktopChange)
//         return () => desktopQuery.removeEventListener('change', handleDesktopChange)
//     }, [])

//     const openNavigation = () => {
//         setProfileOpen(false)
//         setNotificationOpen(false)
//         setNavigationOpen(true)
//     }

//     const closeNavigation = () => setNavigationOpen(false)

//     const handleProfileClick = () => {
//         setNavigationOpen(false)
//         setNotificationOpen(false)
//         onProfileClick()
//     }

//     const handleNotificationClick = () => {
//         setNavigationOpen(false)
//         setProfileOpen(false)
//         onNotificationClick()
//     }

//     return (
//         <>
//             <nav className="relative z-[999] mx-auto w-full max-w-[1480px] px-2 py-3 sm:px-5 sm:py-4">
//                 <div
//                     className={`flex min-w-0 items-center gap-2 rounded-2xl px-2 py-2.5 transition-transform duration-300 sm:gap-3 sm:px-4 ${isChapterPage && navbarHidden ? '-translate-y-full' : 'translate-y-0'}`}
//                     style={{
//                         background: 'rgba(255, 255, 255, 0.08)',
//                         backdropFilter: 'blur(16px)',
//                         WebkitBackdropFilter: 'blur(16px)',
//                         border: '1px solid rgba(255, 255, 255, 0.15)',
//                     }}
//                 >
//                     <button
//                         type="button"
//                         onClick={openNavigation}
//                         aria-label="Open navigation menu"
//                         aria-expanded={navigationOpen}
//                         aria-controls="responsive-navigation-panel"
//                         className="relative flex shrink-0 items-center justify-center rounded-xl transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
//                     >
//                         <ThemedLogo width={46} height={46} fetchPriority="high" decoding="async" />
//                         <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background">
//                             <Menu className="h-3 w-3" />
//                         </span>
//                     </button>

//                     <Link
//                         to="/"
//                         aria-label="Go to homepage"
//                         className="hidden shrink-0 items-center justify-center rounded-xl transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:flex"
//                     >
//                         <ThemedLogo width={60} height={60} fetchPriority="high" decoding="async" />
//                     </Link>

//                     <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
//                         {navLinks.map(({ label, to, active }) => (
//                             <Button
//                                 key={to}
//                                 variant="ghost"
//                                 size="sm"
//                                 asChild
//                                 className="shrink-0 rounded-md font-display tracking-wide"
//                             >
//                                 <Link
//                                     to={to}
//                                     className={`rounded-md px-3 py-1.5 transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
//                                 >
//                                     {label}
//                                 </Link>
//                             </Button>
//                         ))}
//                     </div>

//                     <div className="relative ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 xl:flex-none">
//                         <div className="min-w-0 flex-1 sm:max-w-[430px] xl:w-[300px] xl:flex-none [&>*]:min-w-0 [&>*]:w-full [&_form]:w-full [&_input]:min-w-0 [&_input]:w-full">
//                             <SearchBar />
//                         </div>

//                         {token && (
//                             <NotificationCenter
//                                 open={notificationOpen}
//                                 setOpen={setNotificationOpen}
//                                 buttonRef={notificationButtonRef}
//                                 onButtonClick={handleNotificationClick}
//                             />
//                         )}

//                         <div className="relative shrink-0">
//                             {token ? (
//                                 <Button
//                                     ref={profileButtonRef}
//                                     variant="ghost"
//                                     size="lg"
//                                     onClick={handleProfileClick}
//                                     aria-label="Open account menu"
//                                     aria-expanded={profileOpen}
//                                     className="group h-auto shrink-0 p-0 hover:bg-transparent"
//                                 >
//                                     <NavbarAvatar user={user} />
//                                 </Button>
//                             ) : (
//                                 <Button
//                                     ref={profileButtonRef}
//                                     onClick={handleProfileClick}
//                                     size="sm"
//                                     className="shrink-0 rounded-md px-6 py-3.5 text-xs sm:px-3 md:text-sm"
//                                 >
//                                     Login
//                                 </Button>
//                             )}

//                             <Suspense fallback={null}>
//                                 <Profile
//                                     open={profileOpen}
//                                     setOpen={setProfileOpen}
//                                     buttonRef={profileButtonRef}
//                                 />
//                             </Suspense>
//                         </div>
//                     </div>
//                 </div>
//             </nav>

//             <div
//                 className={`fixed inset-0 z-[1200] xl:hidden ${navigationOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}
//                 aria-hidden={!navigationOpen}
//             >
//                 <button
//                     type="button"
//                     aria-label="Close navigation menu"
//                     onClick={closeNavigation}
//                     tabIndex={navigationOpen ? 0 : -1}
//                     className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${navigationOpen ? 'opacity-100' : 'opacity-0'}`}
//                 />
//                 <aside
//                     id="responsive-navigation-panel"
//                     role="dialog"
//                     aria-modal="true"
//                     aria-label="Navigation menu"
//                     className={`absolute inset-y-0 left-0 flex w-full flex-col border-r border-border bg-background shadow-2xl transition-transform duration-300 ease-out sm:w-[380px] sm:max-w-[90vw] ${navigationOpen ? 'translate-x-0' : '-translate-x-full'}`}
//                 >
//                     <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
//                         <Link
//                             to="/"
//                             onClick={closeNavigation}
//                             aria-label="Go to homepage"
//                             className="inline-flex items-center rounded-xl transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                         >
//                             <ThemedLogo
//                                 width={60}
//                                 height={60}
//                                 fetchPriority="high"
//                                 decoding="async"
//                             />
//                         </Link>
//                         <Button
//                             type="button"
//                             variant="ghost"
//                             size="icon"
//                             onClick={closeNavigation}
//                             aria-label="Close navigation menu"
//                             className="rounded-full"
//                         >
//                             <X className="h-5 w-5" />
//                         </Button>
//                     </div>
//                     <div className="flex-1 overflow-y-auto px-4 py-6">
//                         <div className="space-y-2">
//                             {navLinks.map(({ label, to, active }) => (
//                                 <Link
//                                     key={to}
//                                     to={to}
//                                     onClick={closeNavigation}
//                                     className={`flex min-h-12 w-full items-center rounded-xl px-4 text-sm font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground hover:bg-accent'}`}
//                                 >
//                                     {label}
//                                 </Link>
//                             ))}
//                         </div>
//                     </div>
//                 </aside>
//             </div>
//         </>
//     )
// }

// function NavbarAvatar({ user }: { user: User | null }) {
//     const [avatarFailed, setAvatarFailed] = useState(false)
//     const avatarUrl = user?.avatar && !avatarFailed ? storageUrl(user.avatar) : null
//     const fallback = (user?.username ?? 'G')[0].toUpperCase()

//     useEffect(() => {
//         setAvatarFailed(false)
//     }, [user?.avatar])

//     return (
//         <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-transparent bg-primary text-sm font-bold text-primary-foreground transition-shadow group-hover:shadow-md">
//             {avatarUrl ? (
//                 <img
//                     src={avatarUrl}
//                     alt={user?.username ?? 'User'}
//                     className="h-full w-full object-cover"
//                     onError={() => setAvatarFailed(true)}
//                 />
//             ) : (
//                 fallback
//             )}
//         </div>
//     )
// }
import {
    lazy,
    Suspense,
    useEffect,
    useState,
    type Dispatch,
    type RefObject,
    type SetStateAction,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Coins, Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import SearchBar from '@/components/search/SearchBar'
import ThemedLogo from '@/components/layout/ThemedLogo'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import { useWallet } from '@/hooks/useWallet'
import type { User } from '@/store/authStore'
import { storageUrl } from '@/utils/storage'

const Profile = lazy(() => import('@/components/profile/Profile'))

interface NavbarViewProps {
    user: User | null
    token: string | null
    isChapterPage: boolean
    isComicsActive: boolean
    isDailyActive: boolean
    isNovelsActive: boolean
    isArtsActive: boolean
    isCommissionsActive: boolean
    isShopActive: boolean
    navbarHidden: boolean
    profileOpen: boolean
    notificationOpen: boolean
    profileButtonRef: RefObject<HTMLButtonElement | null>
    notificationButtonRef: RefObject<HTMLButtonElement | null>
    onProfileClick: () => void
    onNotificationClick: () => void
    setProfileOpen: Dispatch<SetStateAction<boolean>>
    setNotificationOpen: Dispatch<SetStateAction<boolean>>
}

export default function NavbarView({
    user,
    token,
    isChapterPage,
    isDailyActive,
    isComicsActive,
    isNovelsActive,
    isArtsActive,
    isCommissionsActive,
    isShopActive,
    navbarHidden,
    profileOpen,
    notificationOpen,
    profileButtonRef,
    notificationButtonRef,
    onProfileClick,
    onNotificationClick,
    setProfileOpen,
    setNotificationOpen,
}: NavbarViewProps) {
    const location = useLocation()
    const [navigationOpen, setNavigationOpen] = useState(false)
    const { wallet } = useWallet()

    const navLinks = [
        { label: 'HOME', to: '/', active: location.pathname === '/' },
        { label: 'DAILY', to: '/daily', active: isDailyActive },
        { label: 'COMIX', to: '/comix', active: isComicsActive },
        { label: 'NOVELS', to: '/novels', active: isNovelsActive },
        { label: 'ARTS', to: '/explore/arts', active: isArtsActive },
        { label: 'COMMISSION', to: '/commissions', active: isCommissionsActive },
        { label: 'SHOP', to: '/shop', active: isShopActive },
    ]

    useEffect(() => {
        setNavigationOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (!navigationOpen) return
        const previousOverflow = document.body.style.overflow
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setNavigationOpen(false)
        }
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [navigationOpen])

    useEffect(() => {
        const desktopQuery = window.matchMedia('(min-width: 1280px)')
        const handleDesktopChange = (event: MediaQueryListEvent) => {
            if (event.matches) setNavigationOpen(false)
        }
        desktopQuery.addEventListener('change', handleDesktopChange)
        return () => desktopQuery.removeEventListener('change', handleDesktopChange)
    }, [])

    const openNavigation = () => {
        setProfileOpen(false)
        setNotificationOpen(false)
        setNavigationOpen(true)
    }

    const closeNavigation = () => setNavigationOpen(false)

    const handleProfileClick = () => {
        setNavigationOpen(false)
        setNotificationOpen(false)
        onProfileClick()
    }

    const handleNotificationClick = () => {
        setNavigationOpen(false)
        setProfileOpen(false)
        onNotificationClick()
    }

    return (
        <>
            <div className="relative z-[1000] w-full border-b border-blue-200/50 bg-[linear-gradient(90deg,#3FA8FF_0%,#FFB14D33_100%)] py-2.5 text-center text-sm text-slate-800 shadow-sm">
                Have a concern or spotted an issue? Please{' '}
                <Link
                    to="/tickets"
                    className="font-semibold text-black underline-offset-4 transition hover:text-blue-900 hover:underline"
                >
                    let us know here
                </Link>
                .
            </div>
            <nav className="relative z-[999] mx-auto w-full max-w-[1480px] px-2 py-3 sm:px-5 sm:py-4">
                <div
                    className={`flex min-w-0 items-center gap-2 rounded-2xl px-2 py-2.5 transition-transform duration-300 sm:gap-3 sm:px-4 ${isChapterPage && navbarHidden ? '-translate-y-full' : 'translate-y-0'}`}
                    style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                >
                    <button
                        type="button"
                        onClick={openNavigation}
                        aria-label="Open navigation menu"
                        aria-expanded={navigationOpen}
                        aria-controls="responsive-navigation-panel"
                        className="relative flex shrink-0 items-center justify-center rounded-xl transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
                    >
                        <ThemedLogo width={46} height={46} fetchPriority="high" decoding="async" />
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background">
                            <Menu className="h-3 w-3" />
                        </span>
                    </button>

                    <Link
                        to="/"
                        aria-label="Go to homepage"
                        className="hidden shrink-0 items-center justify-center rounded-xl transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:flex"
                    >
                        <ThemedLogo width={60} height={60} fetchPriority="high" decoding="async" />
                    </Link>

                    <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
                        {navLinks.map(({ label, to, active }) => (
                            <Button
                                key={to}
                                variant="ghost"
                                size="sm"
                                asChild
                                className="shrink-0 rounded-md font-display tracking-wide"
                            >
                                <Link
                                    to={to}
                                    className={`rounded-md px-3 py-1.5 transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                                >
                                    {label}
                                </Link>
                            </Button>
                        ))}
                    </div>

                    <div className="relative ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 xl:flex-none">
                        <div className="min-w-0 flex-1 sm:max-w-[430px] xl:w-[300px] xl:flex-none [&>*]:min-w-0 [&>*]:w-full [&_form]:w-full [&_input]:min-w-0 [&_input]:w-full">
                            <SearchBar />
                        </div>

                        {token && (
                            <Link
                                to="/credits"
                                className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1.5 text-sm font-semibold text-foreground transition hover:bg-accent/50 sm:px-3"
                            >
                                <Coins className="h-4 w-4 text-primary" />
                                <span>{wallet?.balance ?? 0}</span>
                            </Link>
                        )}
                        {token && (
                            <NotificationCenter
                                open={notificationOpen}
                                setOpen={setNotificationOpen}
                                buttonRef={notificationButtonRef}
                                onButtonClick={handleNotificationClick}
                            />
                        )}

                        <div className="relative shrink-0">
                            {token ? (
                                <Button
                                    ref={profileButtonRef}
                                    variant="ghost"
                                    size="lg"
                                    onClick={handleProfileClick}
                                    aria-label="Open account menu"
                                    aria-expanded={profileOpen}
                                    className="group h-auto shrink-0 p-0 hover:bg-transparent"
                                >
                                    <NavbarAvatar user={user} />
                                </Button>
                            ) : (
                                <Button
                                    ref={profileButtonRef}
                                    onClick={handleProfileClick}
                                    size="sm"
                                    className="shrink-0 rounded-md px-6 py-3.5 text-xs sm:px-3 md:text-sm"
                                >
                                    Login
                                </Button>
                            )}

                            <Suspense fallback={null}>
                                <Profile
                                    open={profileOpen}
                                    setOpen={setProfileOpen}
                                    buttonRef={profileButtonRef}
                                />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </nav>

            <div
                className={`fixed inset-0 z-[1200] xl:hidden ${navigationOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}
                aria-hidden={!navigationOpen}
            >
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={closeNavigation}
                    tabIndex={navigationOpen ? 0 : -1}
                    className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${navigationOpen ? 'opacity-100' : 'opacity-0'}`}
                />
                <aside
                    id="responsive-navigation-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation menu"
                    className={`absolute inset-y-0 left-0 flex w-full flex-col border-r border-border bg-background shadow-2xl transition-transform duration-300 ease-out sm:w-[380px] sm:max-w-[90vw] ${navigationOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                        <Link
                            to="/"
                            onClick={closeNavigation}
                            aria-label="Go to homepage"
                            className="inline-flex items-center rounded-xl transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <ThemedLogo
                                width={60}
                                height={60}
                                fetchPriority="high"
                                decoding="async"
                            />
                        </Link>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={closeNavigation}
                            aria-label="Close navigation menu"
                            className="rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        <div className="space-y-2">
                            {navLinks.map(({ label, to, active }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={closeNavigation}
                                    className={`flex min-h-12 w-full items-center rounded-xl px-4 text-sm font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground hover:bg-accent'}`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </>
    )
}

function NavbarAvatar({ user }: { user: User | null }) {
    const [avatarFailed, setAvatarFailed] = useState(false)
    const avatarUrl = user?.avatar && !avatarFailed ? storageUrl(user.avatar) : null
    const fallback = (user?.username ?? 'G')[0].toUpperCase()

    useEffect(() => {
        setAvatarFailed(false)
    }, [user?.avatar])

    return (
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-transparent bg-primary text-sm font-bold text-primary-foreground transition-shadow group-hover:shadow-md">
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={user?.username ?? 'User'}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarFailed(true)}
                />
            ) : (
                fallback
            )}
        </div>
    )
}
