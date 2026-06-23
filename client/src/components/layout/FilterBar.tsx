import { Link, useLocation } from 'react-router-dom'

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

const SUB_NAV: Record<string, { label: string; href: string }[]> = {
    '/all-comics': [
        ...DAYS.map((d) => ({ label: d, href: `/all-comics?day=${d.toLowerCase()}` })),
        { label: 'Completed', href: '/all-comics?status=completed' },
        { label: 'Rankings', href: '/all-comics?view=rankings' },
    ],
    '/all-wattpad': [
        ...DAYS.map((d) => ({ label: d, href: `/all-wattpad?day=${d.toLowerCase()}` })),
        { label: 'Completed', href: '/all-wattpad?status=completed' },
        { label: 'Rankings', href: '/all-wattpad?view=rankings' },
    ],
}

export default function FilterBar() {
    const location = useLocation()

    const activeSection = location.pathname.startsWith('/all-wattpad')
        ? '/all-wattpad'
        : location.pathname.startsWith('/all-comics')
          ? '/all-comics'
          : null

    const subNavItems = activeSection ? SUB_NAV[activeSection] : null

    if (!subNavItems) return null

    const currentGenre = new URLSearchParams(location.search).get('genre')

    const buildHref = (href: string) => {
        const [path, search] = href.split('?')
        const next = new URLSearchParams(search)
        const genre = new URLSearchParams(location.search).get('genre')
        if (genre) next.set('genre', genre)
        return next.toString() ? `${path}?${next.toString()}` : path
    }

    const buildGenreHref = (genre: string | null) => {
        const params = new URLSearchParams(location.search)
        if (genre) {
            params.set('genre', genre)
        } else {
            params.delete('genre')
        }
        return params.toString() ? `${location.pathname}?${params.toString()}` : location.pathname
    }

    return (
        <div className="bg-[#fffdf5] dark:bg-[#201d18] border-b-[2.5px] border-foreground/10 dark:border-[#3a3328]">
            <div className="max-w-[1126px] mx-auto">
                {/* ── Top row: day/status tabs ── */}
                <div className="flex items-center dark:border-white/5 overflow-x-auto">
                    {subNavItems.map((item) => {
                        const href = buildHref(item.href)
                        const isActive = location.pathname + location.search === href
                        return (
                            <Link
                                key={item.href}
                                to={href}
                                aria-current={isActive ? 'page' : undefined}
                                className="relative shrink-0 px-4 py-3 no-underline transition-colors duration-100 font-bebas"
                            >
                                <span
                                    className={`text-[13px] tracking-[0.12em] transition-colors duration-100 ${
                                        isActive
                                            ? 'text-foreground font-bold'
                                            : 'text-foreground/40 dark:text-white/30 hover:text-foreground/70'
                                    }`}
                                >
                                    {item.label.toUpperCase()}
                                </span>
                                {/* Underline indicator */}
                                {isActive && (
                                    <span className="absolute bottom-0 left-4 right-4 h-[2.5px] bg-foreground dark:bg-white rounded-full" />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* ── Bottom row: genre pills ── */}
                <div className="flex items-center gap-2 px-2 py-2 overflow-x-auto">
                    {GENRES.map((genre) => {
                        const isAll = genre === 'All'
                        const isActive = isAll ? !currentGenre : currentGenre === genre
                        return (
                            <Link
                                key={genre}
                                to={buildGenreHref(isAll ? null : genre)}
                                className="shrink-0 no-underline"
                            >
                                <span
                                    className={`inline-block px-3 py-1 rounded-full text-[11px] tracking-[0.08em] border transition-colors duration-100 font-bebas ${
                                        isActive
                                            ? 'bg-foreground text-background dark:bg-white dark:text-[#1a1a1a] border-foreground dark:border-white'
                                            : 'bg-transparent text-foreground/50 dark:text-white/30 border-foreground/20 dark:border-white/15 hover:border-foreground/50 hover:text-foreground dark:hover:text-white/70'
                                    }`}
                                >
                                    {genre.toUpperCase()}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
