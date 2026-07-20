import { Link } from 'react-router-dom'
import type { PageWidget } from '@/types/pageLayout'

export default function ContentTabsWidget({ widget }: { widget: PageWidget }) {
    const tabs = [
        { key: 'tabs_show_main', label: 'Main', detail: 'Mix', href: '/' },
        { key: 'tabs_show_comix', label: 'Comix', detail: 'Webcomics', href: '/comix' },
        { key: 'tabs_show_novels', label: 'Novels', detail: 'Novels', href: '/comix?type=novel' },
        { key: 'tabs_show_arts', label: 'Arts', detail: 'Art posts', href: '/explore/arts' },
        {
            key: 'tabs_show_commissions',
            label: 'Commission',
            detail: 'Open services',
            href: '/commissions',
        },
    ].filter((tab) => Boolean(widget.settings[tab.key as keyof typeof widget.settings]))

    if (tabs.length === 0) return null

    return (
        <section className="mx-auto w-full max-w-[1360px] px-5 py-4">
            <nav className="flex flex-wrap gap-2" aria-label={widget.title || 'Content tabs'}>
                {tabs.map((tab) => (
                    <Link
                        key={tab.key}
                        to={tab.href}
                        className="rounded-full border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
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
