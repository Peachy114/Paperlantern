import type { Dispatch, SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import SearchBar from '../pages/SearchBar'
import Profile from '../pages/Profile'

interface NavbarViewProps {
    user: any
    token: string | null
    isChapterPage: boolean
    isComicsActive: boolean
    isNovelsActive: boolean
    navbarHidden: boolean
    profileOpen: boolean
    profileButtonRef: React.RefObject<HTMLButtonElement | null>
    onProfileClick: () => void
    setProfileOpen: Dispatch<SetStateAction<boolean>>
}

export default function NavbarView({
    user,
    token,
    isChapterPage,
    isComicsActive,
    isNovelsActive,
    navbarHidden,
    profileOpen,
    profileButtonRef,
    onProfileClick,
    setProfileOpen,
}: NavbarViewProps) {
    const navLinks = [
        { label: 'COMIX', to: '/comix', active: isComicsActive },
        { label: 'ARTS', to: '/arts', active: isNovelsActive },
    ]

    return (
        <nav className="w-full z-999 max-w-[1360px] mx-auto px-5 py-4">
            <div
                className={`grid grid-cols-3 items-center gap-2 md:gap-3 px-4 py-2.5 rounded-2xl transition-transform duration-300 ${
                    isChapterPage && navbarHidden ? '-translate-y-full' : 'translate-y-0'
                }`}
                style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
            >
                {/* LOGO — left column */}
                <div className="flex items-center gap-4 justify-self-start">
                    <Link to="/" className="shrink-0">
                        <img
                            src="/logo_white.png"
                            alt="logo"
                            width={100}
                            height={100}
                            className="dark:block hidden"
                        />

                        <img
                            src="/logo_black.png"
                            alt="logo"
                            width={100}
                            height={100}
                            className="dark:hidden block"
                        />
                    </Link>
                </div>

                {/* Nav links — center column */}
                <div className="hidden md:flex items-center gap-1 justify-self-center">
                    {navLinks.map(({ label, to, active }) => (
                        <Button
                            key={to}
                            variant="ghost"
                            size="sm"
                            asChild
                            className="font-display tracking-wide rounded-md"
                        >
                            <Link
                                to={to}
                                className={`px-3 py-1.5 rounded-md transition-colors ${
                                    active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                }`}
                            >
                                {label}
                            </Link>
                        </Button>
                    ))}
                </div>

                {/* Right column */}
                <div className="relative flex items-center gap-2 md:gap-3 justify-self-end">
                    <SearchBar />

                    {token ? (
                        <Button
                            ref={profileButtonRef}
                            variant="ghost"
                            size="lg"
                            onClick={onProfileClick}
                            className="p-0 h-auto hover:bg-transparent group"
                        >
                            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold overflow-hidden border border-transparent transition-shadow group-hover:shadow-md">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    (user?.username ?? 'G')[0].toUpperCase()
                                )}
                            </div>
                        </Button>
                    ) : (
                        <Button
                            ref={profileButtonRef}
                            onClick={onProfileClick}
                            size="sm"
                            className="rounded-md text-xs md:text-sm"
                        >
                            Login
                        </Button>
                    )}

                    {profileOpen && (
                        <Profile
                            open={profileOpen}
                            setOpen={setProfileOpen}
                            buttonRef={profileButtonRef}
                        />
                    )}
                </div>
            </div>
        </nav>
    )
}
