import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const GENRES = [
    'All',
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Thriller',
    'Sports',
    'Supernatural',
    'Historical',
    'Psychological',
]
const TYPES = [
    { label: 'Comic', value: 'comic' },
    { label: 'Novel', value: 'novel' },
]
const SUB_NAV = [
    ...DAYS.map((d) => ({ label: d, key: 'day', value: d.toLowerCase() })),
    { label: 'Completed', key: 'status', value: 'completed' },
    { label: 'Rankings', key: 'view', value: 'rankings' },
]

export default function ContentFilter() {
    const location = useLocation()
    const navigate = useNavigate()

    if (location.pathname !== '/' && !location.pathname.startsWith('/comix')) return null

    const searchParams = new URLSearchParams(location.search)
    const currentType = searchParams.get('type') ?? 'comic'
    const currentGenre = searchParams.get('genre')
    const currentDay = searchParams.get('day')
    const currentStatus = searchParams.get('status')
    const currentView = searchParams.get('view')

    const buildHref = (key: string, value: string | null) => {
        const next = new URLSearchParams(location.search)
        if (value) next.set(key, value)
        else next.delete(key)
        return next.toString() ? `${location.pathname}?${next.toString()}` : location.pathname
    }

    const buildSubNavHref = (key: string, value: string) => {
        const next = new URLSearchParams(location.search)
        next.delete('day')
        next.delete('status')
        next.delete('view')
        next.set(key, value)
        return `${location.pathname}?${next.toString()}`
    }

    const isSubNavActive = ({ key, value }: { key: string; value: string }) => {
        if (key === 'day') return currentDay === value
        if (key === 'status') return currentStatus === value
        if (key === 'view') return currentView === value
        return false
    }

    const pill = (active: boolean) =>
        active
            ? 'inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap no-underline border bg-black text-white transition-all duration-150'
            : 'inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap no-underline border border-gray-400 text-gray-500 hover:border-[var(--comix-secondary-bg)] hover:text-[var(--comix-secondary-bg)] transition-all duration-150'

    const activeGenreLabel = currentGenre ?? 'All'

    const handleGenreSelect = (value: string) => {
        navigate(buildHref('genre', value === 'All' ? null : value))
    }

    return (
        <div className="font-[var(--comix-font-family)]">
            <div className="w-full max-w-[1390px] mt-20 mx-auto px-4 sm:px-6 md:px-8 py-3">
                {/* Type pills */}
                <div className="flex gap-2 mb-3">
                    {/* Genre dropdown */}
                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={`${pill(!!currentGenre)} gap-1.5`} type="button">
                                    {activeGenreLabel}
                                    <ChevronDown className="size-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                                <DropdownMenuRadioGroup
                                    value={activeGenreLabel}
                                    onValueChange={handleGenreSelect}
                                >
                                    {GENRES.map((genre) => (
                                        <DropdownMenuRadioItem key={genre} value={genre}>
                                            {genre}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {TYPES.map(({ label, value }) => (
                        <Link
                            key={value}
                            to={buildHref('type', value)}
                            className={pill(currentType === value)}
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Day / Status / Rankings bar */}
                <div className="flex items-center justify-center h-11 bg-black dark:bg-zinc-800 dark:border dark:border-zinc-700 rounded-full px-4 sm:px-6 md:px-10 overflow-x-auto gap-3 sm:gap-5 scrollbar-none">
                    {SUB_NAV.map((item) => {
                        const active = isSubNavActive(item)
                        return (
                            <Link
                                key={item.value}
                                to={buildSubNavHref(item.key, item.value)}
                                className={[
                                    'relative flex items-center justify-center h-full px-3 sm:px-5 text-sm font-medium whitespace-nowrap no-underline transition-colors duration-150 z-[2]',
                                    active
                                        ? 'text-black dark:text-white font-semibold'
                                        : 'text-white/60 hover:text-white/85',
                                ].join(' ')}
                            >
                                {active && (
                                    <span
                                        className="absolute inset-y-1 -inset-x-2.5 -z-10 bg-white dark:bg-[#FE7F2D] rounded-sm"
                                        style={{
                                            clipPath:
                                                'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
                                        }}
                                    />
                                )}
                                {item.label}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
