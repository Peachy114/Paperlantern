import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { announcementApi, type Announcement } from '@/api/announcement'

const PAGE_SIZE = 10
type Filter = 'all' | 'event' | 'announcement'

export default function News() {
    const [items, setItems] = useState<Announcement[]>([])
    const [filter, setFilter] = useState<Filter>('all')
    const [page, setPage] = useState(1)

    useEffect(() => { announcementApi.getPublic().then(({ data }) => setItems(data)) }, [])
    const filtered = useMemo(() => items.filter((item) => filter === 'all' || (filter === 'event' ? item.is_event || item.tag === 'event' : !item.is_event && item.tag !== 'event')), [items, filter])
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const chooseFilter = (next: Filter) => { setFilter(next); setPage(1) }

    return (
        <main className="min-h-screen bg-[var(--surface-soft)] px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <p className="font-display text-sm font-black uppercase tracking-widest text-[var(--selected)]">LaterNComix</p>
                    <h1 className="mt-1 text-3xl font-black sm:text-4xl">News</h1>
                    <p className="mt-2 text-muted-foreground">All platform announcements and community events.</p>
                </div>

                <div className="category-rail mb-5"><div className="category-rail__inner">
                    {(['all', 'event', 'announcement'] as const).map((value) => <button key={value} type="button" data-active={filter === value} className="category-control" onClick={() => chooseFilter(value)}>{value === 'all' ? 'All News' : value === 'event' ? 'Events' : 'Announcements'}</button>)}
                </div></div>

                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    {visible.length ? visible.map((item) => (
                        <Link key={item.id} to={`/news/${item.id}`} className="group block border-b px-5 py-5 last:border-b-0 hover:bg-muted/45 sm:px-8">
                            <time className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                            <div className="mt-1 flex items-center gap-3">
                                <h2 className="min-w-0 flex-1 text-base font-bold group-hover:text-primary sm:text-lg">{item.title}</h2>
                                <span className="rounded-full bg-[var(--selected-soft)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--selected-foreground)]">{item.is_event || item.tag === 'event' ? 'Event' : item.format === 'comic' ? 'Comic News' : 'Announcement'}</span>
                            </div>
                        </Link>
                    )) : <p className="p-12 text-center text-muted-foreground">No News found.</p>}

                    {pageCount > 1 && <div className="flex items-center justify-center gap-5 border-t p-5">
                        <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="grid size-9 place-items-center rounded-full hover:bg-muted disabled:opacity-30"><ChevronLeft className="size-4" /></button>
                        <span className="font-display text-sm font-bold text-[var(--selected)]">{page} / {pageCount}</span>
                        <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} className="grid size-9 place-items-center rounded-full hover:bg-muted disabled:opacity-30"><ChevronRight className="size-4" /></button>
                    </div>}
                </section>
            </div>
        </main>
    )
}
