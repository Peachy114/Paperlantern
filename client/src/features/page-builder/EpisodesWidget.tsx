import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ChapterItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'

export default function EpisodesWidget({
    widget,
    chapters,
    cover,
}: {
    widget: PageWidget
    chapters: ChapterItem[]
    cover: (path: string | null, variant?: 'sm') => string | null
}) {
    const settings = widget.settings ?? {}
    const source = settings.filter_cards_data ?? 'mixed'
    const limit = Math.max(1, settings.limit ?? 10)
    const filtered = useMemo(() => {
        const next = chapters.filter((chapter) => {
            if (!chapter.work) return false
            if (source === 'comix') return chapter.work.type === 'webtoon'
            if (source === 'novels') return chapter.work.type === 'wattpad'
            if (source === 'arts' || source === 'shop' || source === 'commissions') return false
            return true
        })

        return next.slice(0, limit)
    }, [chapters, limit, source])

    const [activeId, setActiveId] = useState<string | null>(null)
    const active = filtered.find((chapter) => chapter.id === activeId) ?? filtered[0]

    if (filtered.length === 0 || !active?.work) return null

    const title = widget.title || 'New Episodes'
    const activeImage = cover(active.cover ?? active.work.cover, 'sm')
    const sideEpisodes = filtered.slice(0, 5)

    return (
        <section className="mx-auto w-full max-w-[1360px] px-5 py-8">
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-center text-2xl font-black uppercase tracking-tight sm:text-3xl">
                    {title}
                </h2>
                <Link
                    to="/daily?content=comix"
                    className="text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
                >
                    View all
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {filtered.slice(0, 5).map((chapter, index) => (
                    <button
                        key={chapter.id}
                        type="button"
                        onClick={() => setActiveId(chapter.id)}
                        className="group text-left"
                    >
                        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted shadow-md ring-1 ring-black/5">
                            {cover(chapter.cover ?? chapter.work?.cover ?? null, 'sm') && (
                                <img
                                    src={cover(chapter.cover ?? chapter.work?.cover ?? null, 'sm')!}
                                    alt={chapter.work?.title ?? chapter.title}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                            )}
                            {settings.card_show_new !== false && (
                                <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-orange-500 shadow">
                                    New
                                </span>
                            )}
                            {settings.card_show_rank !== false && (
                                <span className="absolute right-2 top-0 rounded-b bg-rose-500 px-2 py-1 text-xs font-black text-white">
                                    {index + 1}
                                </span>
                            )}
                        </div>
                        {settings.card_show_name !== false && (
                            <h3 className="mt-2 line-clamp-2 text-sm font-black">
                                {chapter.work?.title}
                            </h3>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Ch. {chapter.order} - {chapter.title}
                        </p>
                    </button>
                ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.15fr)]">
                <Link
                    to={`/works/${active.work.slug}`}
                    className="group relative min-h-[420px] overflow-hidden rounded-2xl bg-muted shadow-lg"
                >
                    {activeImage && (
                        <img
                            src={activeImage}
                            alt={active.work.title}
                            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-5 text-white">
                        <p className="text-xs font-bold uppercase text-white/80">
                            Ch. {active.order}
                        </p>
                        <h3 className="line-clamp-2 text-xl font-black">{active.work.title}</h3>
                        <p className="mt-1 line-clamp-1 text-sm text-white/80">{active.title}</p>
                    </div>
                </Link>

                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    <div className="relative overflow-hidden bg-sky-400 px-5 py-4 text-white">
                        <h3 className="text-xl font-bold uppercase tracking-wide">{title}</h3>
                        <div className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full border-[14px] border-white/20" />
                    </div>
                    <div className="divide-y">
                        {sideEpisodes.map((chapter) => (
                            <Link
                                key={chapter.id}
                                to={`/works/${chapter.work!.slug}`}
                                className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition hover:bg-muted/50"
                            >
                                <div className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
                                    {cover(chapter.cover ?? chapter.work?.cover ?? null, 'sm') && (
                                        <img
                                            src={cover(chapter.cover ?? chapter.work?.cover ?? null, 'sm')!}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                        New
                                    </span>
                                    <p className="mt-1 line-clamp-1 text-sm font-black">
                                        Chapter {chapter.order}: {chapter.title}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
