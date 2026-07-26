import { BookOpen, Eye, Heart, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { storageUrl } from '@/utils/storage'

const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-slate-500',
    ongoing: 'bg-emerald-500',
    completed: 'bg-sky-500',
    hiatus: 'bg-amber-500',
}

export interface Work {
    id: string
    slug: string
    title: string
    type: 'webtoon' | 'wattpad'
    status: 'draft' | 'ongoing' | 'completed' | 'hiatus'
    cover: string | null
    chapters_count: number
    views: number
    likes: number
    favorites?: number
    favorites_count?: number
    comments?: number
    comments_count?: number
    genres: string[]
    created_at: string
    boosted_until?: string | null
}

interface WorkViewTableProps {
    works: Work[]
    selectedSlugs: string[]
    onSelectWork: (slug: string) => void
    onNavigate: (path: string) => void
    onDeleteRequest: (slug: string) => void
    onBoostRequest: (work: Work) => void
    onCreateFirst: () => void
}

export default function WorkViewTable({
    works,
    selectedSlugs,
    onSelectWork,
    onNavigate,
    onDeleteRequest,
    onBoostRequest,
    onCreateFirst,
}: WorkViewTableProps) {
    if (works.length === 0) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 px-5 text-center">
                <BookOpen className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-semibold">No works yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Create your first work to start building your studio.
                </p>
                <Button onClick={onCreateFirst} className="mt-4 rounded-full">
                    Create your first work
                </Button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {works.map((work) => {
                const selected = selectedSlugs.includes(work.slug)
                const cover = storageUrl(work.cover)

                return (
                    <article
                        key={work.slug}
                        className={`group overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                            selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-slate-200'
                        }`}
                    >
                        <div
                            className="relative aspect-[3/4] cursor-pointer overflow-hidden bg-muted"
                            onClick={() => onNavigate(`/studio/works/${work.slug}/chapters`)}
                        >
                            {cover ? (
                                <img
                                    src={cover}
                                    alt={work.title}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 via-rose-100 to-sky-100">
                                    <BookOpen className="h-9 w-9 text-slate-400" />
                                </div>
                            )}

                            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                                <span className="rounded-full bg-white/90 px-2 py-1 text-[9px] font-bold text-slate-700 shadow-sm backdrop-blur">
                                    {work.type === 'wattpad' ? 'Novel' : 'Comix'}
                                </span>
                                <span
                                    className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize text-white shadow-sm ${
                                        STATUS_STYLE[work.status] ?? 'bg-slate-500'
                                    }`}
                                >
                                    {work.status}
                                </span>
                            </div>

                            <label
                                className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => onSelectWork(work.slug)}
                                    className="h-4 w-4 accent-sky-500"
                                    aria-label={`Select ${work.title}`}
                                />
                            </label>

                            {work.boosted_until ? (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onBoostRequest(work)
                                    }}
                                    className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-white shadow"
                                    title="Boosted work"
                                >
                                    <Sparkles size={13} />
                                </button>
                            ) : null}
                        </div>

                        <div className="p-2.5">
                            <button
                                type="button"
                                onClick={() => onNavigate(`/studio/works/${work.slug}/chapters`)}
                                className="line-clamp-2 min-h-9 w-full text-left text-xs font-black leading-[1.35] hover:text-sky-500"
                            >
                                {work.title}
                            </button>

                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {work.views.toLocaleString()}
                                </span>
                                <span className="inline-flex items-center gap-1 text-rose-500">
                                    <Heart className="h-3 w-3 fill-current" />
                                    {(work.likes ?? 0).toLocaleString()}
                                </span>
                                <span>{work.chapters_count} ch</span>
                            </div>

                            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => onNavigate(`/studio/works/${work.slug}/edit`)}
                                    className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-rose-400 text-[9px] font-bold text-white transition hover:bg-rose-500"
                                >
                                    <Pencil size={10} />
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDeleteRequest(work.slug)}
                                    className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-sky-400 text-[9px] font-bold text-white transition hover:bg-sky-500"
                                >
                                    <Trash2 size={10} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </article>
                )
            })}
        </div>
    )
}
