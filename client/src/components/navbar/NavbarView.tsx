import type { Dispatch, SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import SearchBar from '../pages/SearchBar'
import Profile from '../pages/Profile'
import { BookOpen, PenTool } from 'lucide-react'

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
        { label: 'COMIX', to: '/comix', active: isComicsActive, icon: BookOpen },
        { label: 'ARTS', to: '/arts', active: isNovelsActive, icon: PenTool },
    ]

    return (
        <nav className="z-30 ">
            <div className="w-full max-w-[1360px] mx-auto px-5 pt-3">
                <div className="flex items-center justify-between gap-2 md:gap-3 px-4 py-2.5">
                    <div
                        className={`transition-transform duration-300 ${
                            isChapterPage && navbarHidden ? '-translate-y-full' : 'translate-y-0'
                        }`}
                    >
                        {/* LOGO */}
                        <div className="flex items-center gap-4">
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
                            <Separator
                                orientation="vertical"
                                className="h-6 bg-border hidden md:block"
                            />

                            {/* nav links */}
                            <div className="hidden md:flex items-center gap-1">
                                {navLinks.map(({ label, to, active, icon: Icon }) => (
                                    <Button
                                        key={to}
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="font-display tracking-wide rounded-md"
                                    >
                                        <Link
                                            to={to}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                                                active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="relative flex items-center gap-2 md:gap-3">
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
            </div>
        </nav>
    )
}
