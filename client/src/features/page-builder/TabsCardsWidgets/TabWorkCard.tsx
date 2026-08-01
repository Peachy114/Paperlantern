import { Eye, Heart, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PageWidget } from '@/types/pageLayout'
import { type TabCardItem } from './types'

import { 
    imageFor,
    getTypeLabel,
    getEventLabel,
    getStatusLabel,
    isNewItem,
    formatCount,
    hrefFor,
} from './tabCard.utils'


export default function TabWorkCard({
    item,
    rank,
    widget,
}: {
    item: TabCardItem
    rank: number
    widget: PageWidget
}) {
    const settings = widget.settings ?? {}

    const image = imageFor(item)
    const typeLabel = getTypeLabel(item.type)
    const primaryGenre = item.genres?.[0]
    const secondaryGenre = item.genres?.[1]

    const eventLabel = getEventLabel(item)
    const statusLabel = getStatusLabel(item)
    const newItem = isNewItem(item.created_at)
    const boosted = Boolean(item.boosted_until)

    const showTitle = settings.card_show_name !== false
    const showViews = settings.card_show_views !== false
    const showLikes = settings.card_show_likes !== false
    const showStatus = settings.card_show_status !== false
    const showGenres = settings.card_show_genres !== false
    const showType = settings.card_show_type !== false
    const showRank = settings.card_show_rank !== false

    const showStats = showViews || showLikes
    const showLabels = showType || (showGenres && Boolean(primaryGenre || secondaryGenre))

    return (
        <Link
            to={hrefFor(item)}
            className="group block h-full min-w-0 no-underline"
            aria-label={`Open ${item.title}`}
        >
            <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] text-card-foreground transition-all duration-300 group-hover:-translate-y-1">
                {/* Cover */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[15px] bg-muted">
                    {image ? (
                        <img
                            src={image}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted px-4 text-center text-xs text-muted-foreground">
                            No Cover
                        </div>
                    )}

                    {/* Gradient scrim so top/bottom badges stay legible on any cover */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/35 to-transparent" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent" />

                    {/* Top-left labels */}
                    <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap items-center gap-1.5">
                        {showStatus && eventLabel && (
                            <span className="inline-flex h-5 max-w-24 items-center justify-center truncate rounded-full bg-white px-2.5 text-[9px] font-semibold text-amber-600 shadow-sm">
                                {eventLabel}
                            </span>
                        )}

                        {newItem && (
                            <span className="inline-flex h-5 items-center justify-center rounded-full bg-[var(--comix-badge-new)] px-3 text-[9px] font-semibold text-white shadow-sm">
                                New
                            </span>
                        )}
                    </div>

                    {/* Rank ribbon */}
                    {showRank && (
                        <div
                            className="absolute right-2 top-0 z-20 flex h-10 w-7 items-start justify-center bg-red-500 pt-1.5 text-[11px] font-bold text-white shadow-sm"
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)',
                            }}
                        >
                            {rank}
                        </div>
                    )}

                    {/* Status */}
                    {showStatus && statusLabel && (
                        <span className="absolute bottom-2 left-2 z-10 inline-flex max-w-[45%] items-center truncate rounded-full bg-[var(--comix-accent)] px-2.5 py-1 text-[9px] font-semibold capitalize text-white shadow-sm">
                            {statusLabel}
                        </span>
                    )}

                    {/* Boosted */}
                    {boosted && (
                        <span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-bold text-black shadow-sm">
                            <Sparkles className="size-3" />
                            Boosted
                        </span>
                    )}
                </div>

                {/* Information area */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-1 pb-1 pt-2">
                    {/* Title */}
                    {showTitle && (
                        <h3
                            title={item.title}
                            className="overflow-hidden text-ellipsis text-[13px] font-extrabold leading-5 text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                        >
                            {item.title}
                        </h3>
                    )}

                    {/* Statistics */}
                    {showStats && (
                        <div className="flex min-h-5 flex-wrap items-center gap-3 text-[10px] font-medium text-muted-foreground">
                            {showViews && (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                    <Eye className="size-3.5 shrink-0" />
                                    <span>{formatCount(item.views ?? 0)}</span>
                                </span>
                            )}

                            {showLikes && (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                    <Heart className="size-3.5 shrink-0 fill-red-500 text-red-500" />
                                    <span>{formatCount(item.likes ?? 0)}</span>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Type and genre labels */}
                    {showLabels && (
                        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                            {showType && (
                                <span className="inline-flex min-w-0 items-center truncate rounded-full bg-[var(--comix-accent)]/10 px-2.5 py-1 text-[9px] font-semibold text-[var(--comix-accent)]">
                                    {typeLabel}
                                </span>
                            )}

                            {showGenres && primaryGenre && (
                                <span className="inline-flex min-w-0 items-center truncate rounded-full bg-[var(--comix-accent)] px-2.5 py-1 text-[9px] font-medium text-white">
                                    {primaryGenre}
                                </span>
                            )}

                            {showGenres && secondaryGenre && (
                                <span className="inline-flex min-w-0 items-center truncate rounded-full bg-[var(--comix-accent)] px-2.5 py-1 text-[9px] font-medium text-white">
                                    {secondaryGenre}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </article>
        </Link>
    )
}