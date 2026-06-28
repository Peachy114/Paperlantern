import type { Dispatch, SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import SearchBar from '../pages/SearchBar'
import Profile from '../pages/Profile'
import { Heart, GalleryVertical } from 'lucide-react'

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
        { label: 'ARTISTS', to: '/artists', active: isNovelsActive },
    ]

    return (
        <nav className="w-full fixed md:absolute z-30 border-b bg-white dark:bg-black">
            <div className="w-full max-w-[1360px] mx-auto py-2 px-5 z-[999] relative flex items-center justify-between gap-1 md:gap-2">
                <div
                    className={`transition-transform duration-300 ${
                        isChapterPage && navbarHidden ? '-translate-y-full' : 'translate-y-0'
                    }`}
                >
                    {/* LOGOO */}
                    <div className="flex justify-between items-center">
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
                            className="h-6 bg-white/20 hidden md:block mr-5"
                        />

                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map(({ label, to, active }) => (
                                <Button
                                    key={to}
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className={
                                        active
                                            ? 'text-black dark:text-white'
                                            : 'text-black/50 dark:text-white/50'
                                    }
                                >
                                    <Link to={to}>{label}</Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div className="relative flex items-center gap-1 md:gap-2">
                    <SearchBar />
                    {/* Wishlist placeholder */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className="text-black dark:text-white"
                        disabled
                    >
                        <Heart className="w-6 h-6" />
                    </Button>

                    {/* Library placeholder */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className="text-black dark:text-white"
                        disabled
                    >
                        <GalleryVertical className="w-6 h-6" />
                    </Button>
                    <Button
                        ref={profileButtonRef}
                        variant="ghost"
                        size="lg"
                        onClick={onProfileClick}
                        className="text-black dark:text-white whitespace-nowrap text-xs md:text-sm"
                    >
                        {token ? (
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold overflow-hidden">
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
                        ) : (
                            'LOGIN'
                        )}
                    </Button>
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
