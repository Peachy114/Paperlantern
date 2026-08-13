import { Link, useLocation } from 'react-router-dom'
import type { PageWidget } from '@/types/pageLayout'

export default function ContentTabsWidget({ widget }: { widget: PageWidget }) {
    const location = useLocation()
    const filtersInPlace =
        location.pathname.startsWith('/daily') ||
        location.pathname.startsWith('/rankings') ||
        location.pathname.startsWith('/genre')

    const hrefFor = (content: string, fallbackHref: string) => {
        if (!filtersInPlace) return fallbackHref

        const next = new URLSearchParams(location.search)
        if (content === 'all') {
            next.delete('content')
        } else {
            next.set('content', content)
        }

        const query = next.toString()
        return query ? `${location.pathname}?${query}` : location.pathname
    }

    const tabs = [
        { key: 'tabs_show_main', label: 'Main', content: 'all', href: '/' },
        {
            key: 'tabs_show_comix',
            label: 'Comix',
            content: 'webtoon',
            href: '/comix',
        },
        {
            key: 'tabs_show_novels',
            label: 'Novels',
            content: 'wattpad',
            href: '/novels',
        },
        {
            key: 'tabs_show_arts',
            label: 'Arts',
            content: 'art',
            href: '/explore/arts',
        },
        {
            key: 'tabs_show_commissions',
            label: 'Commission',
            detail: 'Open services',
            content: 'commission',
            href: '/commissions',
        },
    ].filter((tab) => Boolean(widget.settings[tab.key as keyof typeof widget.settings]))
    const activeContent = new URLSearchParams(location.search).get('content') ?? 'all'

    if (tabs.length === 0) return null

    return (
        <section className="mx-auto w-full max-w-[1480px] px-5 py-4">
            <nav className="flex flex-wrap gap-2" aria-label={widget.title || 'Content tabs'}>
                {tabs.map((tab) => (
                    <Link
                        key={tab.key}
                        to={hrefFor(tab.content, tab.href)}
                        aria-current={
                            filtersInPlace && activeContent === tab.content ? 'page' : undefined
                        }
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            filtersInPlace && activeContent === tab.content
                                ? 'bg-banner text-backgroun'
                                : 'bg-background hover:bg-muted '
                        }`}
                    >
                        {tab.label}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {tab.detail}
                        </span>
                    </Link>
                ))}
            </nav>
        </section>
    )
}
