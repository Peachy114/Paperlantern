import { Link } from 'react-router-dom'
import { Eye, Heart, Sparkles } from 'lucide-react'

interface WorkCardProps {
    id: string
    slug?: string
    title: string
    cover: string | null

    type?: 'webtoon' | 'wattpad' | 'novel' | 'manga' | 'manhwa' | 'manhua'

    genres?: string[]
    status?: string

    views?: number
    likes?: number
    rank?: number

    showStats?: boolean

    lastChapterAt?: string | Date | null
    boostedUntil?: string | null

    event?: string | null

    variant?: 'default' | 'weekly'
}

/* // work card date helpers ---- */

function isRecentlyUpdated(date?: string | Date | null): boolean {
    if (!date) {
        return false
    }

    const postedDate = new Date(date)

    if (Number.isNaN(postedDate.getTime())) {
        return false
    }

    const now = new Date()
    const difference = now.getTime() - postedDate.getTime()
    const thirtyDaysInMilliseconds = 30 * 24 * 60 * 60 * 1000

    return difference >= 0 && difference <= thirtyDaysInMilliseconds
}

function formatCount(value?: number): string {
    const count = value ?? 0

    if (count >= 1_000_000) {
        const formatted = count / 1_000_000

        return `${Number.isInteger(formatted) ? formatted : formatted.toFixed(1)}M`
    }

    if (count >= 1_000) {
        const formatted = count / 1_000

        return `${Number.isInteger(formatted) ? formatted : formatted.toFixed(1)}K`
    }

    return count.toLocaleString()
}

export default function WorkCard3(props: WorkCardProps) {
    const {
        id,
        slug,
        title,
        cover,
        type,
        genres = [],
        status,
        views,
        likes,
        rank,
        showStats = [],
        lastChapterAt,
        boostedUntil,
        event,
        variant = 'default',
    } = props

    const hasNewChapter = isRecentlyUpdated(lastChapterAt)
    const isWeekly = variant === 'weekly'
    const primaryGenre = genres[0]
    const SecondaryGenre = genres[1]
    const workUrl = `/works/${slug ?? id}`

    // console.log('WorkCard3 navigation data:', {
    //     workUrl,
    //     id,
    //     slug,
    //     title,
    //     views,
    //     likes,
    //     rank,
    // })

    return (
        <Link
            to={workUrl}
            state={{ work: props }}
            aria-label={`View ${title}`}
            className="group block h-full min-w-0 no-underline"
        >
            {isWeekly ? (
                /* // weekly work card ---- */
                <article className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted">
                    {/* //// weekly cover ---- */}
                    {cover ? (
                        <img
                            src={cover}
                            alt={title}
                            draggable={false}
                            loading="lazy"
                            className="
                                h-full
                                w-full
                                object-cover
                                transition-transform
                                duration-300
                                group-hover:scale-105
                            "
                        />
                    ) : (
                        <div
                            className="
                                flex
                                h-full
                                w-full
                                items-center
                                justify-center
                                bg-muted
                                px-4
                                text-center
                                text-xs
                                text-muted-foreground
                            "
                        >
                            No Cover
                        </div>
                    )}

                    {/* //// weekly gradient ---- */}
                    <div
                        className="
                            pointer-events-none
                            absolute
                            inset-0
                            bg-gradient-to-t
                            from-black/90
                            via-black/10
                            to-transparent
                        "
                    />

                    {/* //// weekly content ---- */}
                    <div
                        className="
                            absolute
                            inset-x-0
                            bottom-0
                            flex
                            items-end
                            gap-2
                            p-3
                        "
                    >
                        {rank !== undefined && (
                            <span
                                className="
                                    shrink-0
                                    font-black
                                    leading-none
                                    text-white
                                "
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: '2.75rem',
                                    WebkitTextStroke: '1px rgba(0, 0, 0, 0.15)',
                                }}
                            >
                                {rank}
                            </span>
                        )}

                        <div className="min-w-0 pb-0.5">
                            <h3
                                className="
                                    line-clamp-2
                                    text-sm
                                    font-bold
                                    leading-snug
                                    text-white
                                "
                            >
                                {title}
                            </h3>

                            {showStats && (
                                <div
                                    className="
                                        mt-1
                                        flex
                                        items-center
                                        gap-1
                                        text-xs
                                        text-white/80
                                    "
                                >
                                    <Heart
                                        className="
                                            size-3
                                            fill-red-500
                                            text-red-500
                                        "
                                    />

                                    <span>{formatCount(likes)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </article>
            ) : (
                /* // default work card ---- */
                <article
                    className="
                        flex
                        h-full
                        min-w-0
                        flex-col
                        overflow-hidden
                        rounded-[20px]
                        border
                        border-border
                        bg-card
                        p-1.5
                        text-card-foreground
                        shadow-md
                        transition-all
                        duration-300
                        group-hover:-translate-y-1
                        group-hover:border-border-strong
                        group-hover:shadow-xl
                    "
                >
                    {/* //// work card image wrapper ---- */}
                    <div
                        className="
                            relative
                            aspect-[3/4]
                            w-full
                            overflow-hidden
                            rounded-[15px]
                            bg-muted
                        "
                    >
                        {cover ? (
                            <img
                                src={cover}
                                alt={title}
                                draggable={false}
                                loading="lazy"
                                className="
                                    h-full
                                    w-full
                                    object-cover
                                    transition-transform
                                    duration-300
                                    group-hover:scale-[1.04]
                                "
                            />
                        ) : (
                            <div
                                className="
                                    flex
                                    h-full
                                    w-full
                                    items-center
                                    justify-center
                                    bg-muted
                                    px-4
                                    text-center
                                    text-xs
                                    text-muted-foreground
                                "
                            >
                                No Cover
                            </div>
                        )}

                        {/* //// top-left badges ---- */}
                        <div
                            className="
                                absolute
                                left-2
                                top-2
                                z-10
                                flex
                                max-w-[calc(100%-3rem)]
                                items-center
                                gap-1.5
                            "
                        >
                            {event && (
                                <span
                                    className="
                                        inline-flex
                                        h-5
                                        max-w-24
                                        items-center
                                        justify-center
                                        truncate
                                        rounded-full
                                        bg-white
                                        px-2.5
                                        text-[9px]
                                        font-semibold
                                        text-amber-500
                                        shadow-sm
                                    "
                                >
                                    {event}
                                </span>
                            )}

                            {hasNewChapter && (
                                <span
                                    className="
                                        inline-flex
                                        h-5
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[var(--comix-badge-new)]
                                        px-3
                                        text-[9px]
                                        font-semibold
                                        text-white
                                        shadow-sm
                                    "
                                >
                                    New
                                </span>
                            )}
                        </div>

                        {/* //// ranking ribbon ---- */}
                        {rank !== undefined && (
                            <div
                                className="
                                    absolute
                                    right-2
                                    top-0
                                    z-20
                                    flex
                                    h-10
                                    w-7
                                    items-start
                                    justify-center
                                    bg-red-500
                                    pt-1.5
                                    text-[11px]
                                    font-bold
                                    text-white
                                    shadow-sm
                                "
                                style={{
                                    clipPath: 'polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)',
                                }}
                            >
                                {rank}
                            </div>
                        )}

                        {/* //// boosted badge ---- */}
                        {boostedUntil && (
                            <span
                                className="
                                    absolute
                                    bottom-2
                                    right-2
                                    z-10
                                    inline-flex
                                    items-center
                                    gap-1
                                    rounded-full
                                    bg-amber-400
                                    px-2
                                    py-1
                                    text-[9px]
                                    font-bold
                                    text-black
                                    shadow-sm
                                "
                            >
                                <Sparkles className="size-3" />
                                Boosted
                            </span>
                        )}

                        {/* //// status badge ---- */}
                        {status && (
                            <span
                                className="
                                    absolute
                                    bottom-2
                                    left-2
                                    z-10
                                    inline-flex
                                    items-center
                                    rounded-full
                                    bg-[var(--comix-accent)]
                                    px-2.5
                                    py-1
                                    text-[9px]
                                    font-semibold
                                    capitalize
                                    text-white
                                    shadow-sm
                                "
                            >
                                {status}
                            </span>
                        )}
                    </div>

                    {/* //// work card body ---- */}
                    <div
                        className="
                            flex
                            min-w-0
                            flex-1
                            flex-col
                            px-1
                            pb-1
                            pt-2
                        "
                    >
                        {/* //// work card title ---- */}
                        <h3
                            className="
        overflow-hidden
        text-ellipsis
        [display:-webkit-box]
        [-webkit-line-clamp:2]
        [-webkit-box-orient:vertical]
        text-[13px]
        font-extrabold
        leading-5
        text-foreground
        h-10
    "
                            title={title}
                        >
                            {title}
                        </h3>

                        {/* //// work card statistics ---- */}
                        {showStats && (
                            <div
                                className="
                                    mt-1.5
                                    flex
                                    items-center
                                    gap-3
                                    text-[10px]
                                    font-medium
                                    text-muted-foreground
                                "
                            >
                                <span
                                    className="
                                        inline-flex
                                        min-w-0
                                        items-center
                                        gap-1
                                    "
                                >
                                    <Eye
                                        className="
                                            size-3.5
                                            shrink-0
                                            text-rose-500
                                        "
                                    />

                                    <span>{formatCount(views)}</span>
                                </span>

                                <span
                                    className="
                                        inline-flex
                                        min-w-0
                                        items-center
                                        gap-1
                                    "
                                >
                                    <Heart
                                        className="
                                            size-3.5
                                            shrink-0
                                            fill-red-500
                                            text-red-500
                                        "
                                    />

                                    <span>{formatCount(likes)}</span>
                                </span>
                            </div>
                        )}

                        {/* //// work card labels ---- */}
                        {(type || primaryGenre) && (
                            <div
                                className="
                                    mt-auto
                                    grid
                                    grid-cols-2
                                    gap-1.5
                                    pt-2
                                "
                            >
                                {type && (
                                    <span
                                        className="
                                            inline-flex
                                            min-w-0
                                            items-center
                                            justify-center
                                            truncate
                                            rounded-full
                                            bg-rose-500
                                            px-2
                                            py-1.5
                                            text-[9px]
                                            font-medium
                                            capitalize
                                            text-white
                                        "
                                    >
                                        {type}
                                    </span>
                                )}

                                {primaryGenre && (
                                    <span
                                        className="
                                            inline-flex
                                            min-w-0
                                            items-center
                                            justify-center
                                            truncate
                                            rounded-full
                                            bg-[var(--comix-blue)]
                                            px-2
                                            py-1.5
                                            text-[9px]
                                            font-medium
                                            text-white
                                        "
                                    >
                                        {primaryGenre}
                                    </span>
                                )}

                                {SecondaryGenre && (
                                    <span
                                        className="
                                            inline-flex
                                            min-w-0
                                            items-center
                                            justify-center
                                            truncate
                                            rounded-full
                                            bg-[var(--no-color)]
                                            px-2
                                            py-1.5
                                            text-[9px]
                                            font-medium
                                            text-white
                                        "
                                    >
                                        {SecondaryGenre}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </article>
            )}
        </Link>
    )
}
