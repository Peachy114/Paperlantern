import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

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

export default function SubNavbar() {
    const location = useLocation()

    const activeSection = location.pathname.startsWith('/all-wattpad')
        ? '/all-wattpad'
        : location.pathname.startsWith('/all-comics')
          ? '/all-comics'
          : null

    const subNavItems = activeSection ? SUB_NAV[activeSection] : null

    if (!subNavItems) return null

    const buildHref = (href: string) => {
        const [path, search] = href.split('?')
        const next = new URLSearchParams(search)
        const genre = new URLSearchParams(location.search).get('genre')
        if (genre) next.set('genre', genre)
        return next.toString() ? `${path}?${next.toString()}` : path
    }

    return (
        <motion.div
            key="sub-nav"
            initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative mt-1 overflow-hidden
                bg-[#fef3c7] dark:bg-[#272318]
                border-[2.5px] border-foreground dark:border-[#3a3328]"
            style={{
                boxShadow: '3px 3px 0 var(--foreground)',
                transformOrigin: 'top',
                backgroundImage:
                    'radial-gradient(circle, rgba(180,160,120,0.06) 1.5px, transparent 1.5px)',
                backgroundSize: '10px 10px',
            }}
        >
            {/* Amber left accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

            <div className="max-w-[1126px] mx-auto px-5 h-10 flex items-center gap-1 overflow-x-auto">
                {subNavItems.map((item) => {
                    const isCurrentLink =
                        location.pathname + location.search === buildHref(item.href)
                    return (
                        <Link
                            key={item.href}
                            to={buildHref(item.href)}
                            className="relative shrink-0 whitespace-nowrap px-3 py-0.5 transition-all duration-100 no-underline text-normal"
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                letterSpacing: '0.1em',
                                color: isCurrentLink ? '#1a1a1a' : 'var(--foreground)',
                                background: isCurrentLink ? '#f59e0b' : 'transparent',
                                border: isCurrentLink
                                    ? '2px solid #1a1a1a'
                                    : '2px solid transparent',
                                boxShadow: isCurrentLink ? '2px 2px 0 #1a1a1a' : 'none',
                                fontWeight: isCurrentLink ? 800 : 600,
                            }}
                            onMouseEnter={(e) => {
                                if (!isCurrentLink) {
                                    e.currentTarget.style.color = '#1a1a1a'
                                    e.currentTarget.style.background = '#fbbf24'
                                    e.currentTarget.style.border = '2px solid #1a1a1a'
                                    e.currentTarget.style.boxShadow = '2px 2px 0 #1a1a1a'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isCurrentLink) {
                                    e.currentTarget.style.color = 'var(--foreground)'
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.border = '2px solid transparent'
                                    e.currentTarget.style.boxShadow = 'none'
                                }
                            }}
                        >
                            {item.label}
                        </Link>
                    )
                })}
            </div>
        </motion.div>
    )
}
