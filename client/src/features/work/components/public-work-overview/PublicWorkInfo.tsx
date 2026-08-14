import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
    BookOpen,
    CalendarDays,
    ChevronRight,
    Eye,
    Heart,
    MessageCircle,
    Settings,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'

interface PublicWorkInfoProps {
    work: any
    isOwner: boolean
    slug: string
    navigate: (path: string) => void
    coverUrl: (url?: string | null, variant?: 'sm') => string | null
    onFirstEpisodeClick?: () => void
    hasFirstEpisode?: boolean
    engagementActions?: ReactNode
}

export default function PublicWorkInfo({
    work,
    isOwner,
    slug,
    navigate,
    coverUrl,
    onFirstEpisodeClick,
    hasFirstEpisode = false,
    engagementActions,
}: PublicWorkInfoProps) {
    /*
     * The sidebar uses ONLY the database `cover` field.
     */
    const coverImage = work?.cover ? coverUrl(work.cover, 'sm') : null

    const authorName = work?.user?.name || work?.user?.username || 'Unknown artist'
    const authorUsername = work?.user?.username ?? null

    const genres = normalizeGenres(work?.genres)
    const scheduleLabel = work?.schedule || statusLabel(work?.status)
    const views = Number(work?.views ?? 0)
    const likes = Number(work?.work_likes_count ?? work?.likes ?? 0)
    const comments = Number(work?.comments_count ?? 0)

    return (
        <CardContent className="p-0">
            {/* ============================================================
                    COVER
                ============================================================ */}
            <div
                className="
                        relative
                        aspect-[4/5]
                        w-full
                        overflow-hidden
                        rounded-[24px]
                        bg-muted
                        shadow-sm
                    "
            >
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={work?.title ? `${work.title} cover` : 'Work cover'}
                        loading="eager"
                        decoding="async"
                        draggable={false}
                        className="
                                h-full
                                w-full
                                object-cover
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
                                text-sm
                                text-muted-foreground
                            "
                    >
                        No cover image
                    </div>
                )}
            </div>

            {/* ============================================================
                    SIDEBAR INFORMATION
                ============================================================ */}
            <div className="pb-1 pt-3">
                {/* Schedule */}
                <div
                    className="
                            flex
                            items-center
                            gap-2
                            text-xs
                            font-bold
                            uppercase
                            tracking-wide
                        "
                >
                    <span
                        className="
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-orange-400
                                text-white
                            "
                    >
                        <CalendarDays className="h-4 w-4" />
                    </span>

                    <span className="font-extrabold">{String(scheduleLabel).toUpperCase()}</span>
                </div>

                {/* Views, likes and comments */}
                <div
                    className="
                            mt-2
                            flex
                            flex-wrap
                            items-center
                            gap-x-3
                            gap-y-1
                            text-[11px]
                            font-medium
                            text-muted-foreground
                        "
                >
                    <Metric icon={<Eye className="h-3.5 w-3.5 text-foreground" />} value={views} />

                    <Metric
                        icon={
                            <Heart
                                className="
                                        h-3.5
                                        w-3.5
                                        fill-red-500
                                        text-red-500
                                    "
                            />
                        }
                        value={likes}
                    />

                    <Metric
                        icon={
                            <MessageCircle
                                className="
                                        h-3.5
                                        w-3.5
                                        fill-orange-400
                                        text-orange-400
                                    "
                            />
                        }
                        value={comments}
                    />
                </div>

                {/* Genres */}
                {genres.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {genres.map((genre) => (
                            <span
                                key={genre}
                                className="
                                        rounded-full
                                        bg-orange-100
                                        px-2.5
                                        py-1
                                        text-[10px]
                                        font-medium
                                        text-orange-500
                                        dark:bg-orange-950/30
                                    "
                            >
                                {genre}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h1
                    className="
                            mt-3
                            text-[15px]
                            font-extrabold
                            leading-[1.15]
                            tracking-tight
                        "
                >
                    {work?.title || 'Untitled work'}
                </h1>

                {/* Author / profile / owner controls */}
                <div
                    className="
                            mt-1
                            flex
                            items-center
                            justify-between
                            gap-2
                        "
                >
                    <p
                        className="
                                min-w-0
                                truncate
                                text-[11px]
                                font-medium
                                text-pink-500
                            "
                    >
                        By:{' '}
                        {authorUsername ? (
                            <Link
                                to={`/artists/${encodeURIComponent(authorUsername)}`}
                                className="
                                        font-semibold
                                        text-pink-500
                                        no-underline
                                        hover:underline
                                    "
                            >
                                {authorName}
                            </Link>
                        ) : (
                            <span className="font-semibold">{authorName}</span>
                        )}
                    </p>

                    <div className="flex shrink-0 items-center gap-1.5">
                        {isOwner && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/studio/works/${slug}/chapters`)}
                                className="
                                        h-7
                                        shrink-0
                                        gap-1
                                        rounded-full
                                        px-2
                                        text-[10px]
                                    "
                            >
                                <Settings className="h-3 w-3" />
                                Manage
                            </Button>
                        )}
                    </div>
                </div>

                {/* Description */}
                {work?.description && (
                    <div
                        className="
                                mt-3
                                space-y-3
                                text-[11px]
                                leading-[1.4]
                                text-foreground/85
                            "
                    >
                        {descriptionParagraphs(work.description).map((paragraph, index) => (
                            <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>
                        ))}
                    </div>
                )}

                {/* Super Like, Like and Favorite */}
                {engagementActions && (
                    <div
                        className="
                                mt-4
                                grid
                                grid-cols-3
                                items-center
                                gap-1
                            "
                    >
                        {engagementActions}
                    </div>
                )}

                {/* First episode */}
                <Button
                    type="button"
                    onClick={onFirstEpisodeClick}
                    disabled={!hasFirstEpisode}
                    className="
                            mt-2
                            h-11
                            w-full
                            rounded-[14px]
                            bg-orange-400
                            px-4
                            text-sm
                            font-semibold
                            text-white
                            shadow-sm
                            hover:bg-orange-500
                            focus-visible:ring-orange-300/40
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                >
                    <BookOpen className="h-4 w-4" />

                    <span>First Episode</span>

                    <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
            </div>
        </CardContent>
    )
}

function Metric({ icon, value }: { icon: ReactNode; value: number }) {
    return (
        <span className="inline-flex items-center gap-1">
            {icon}
            <span>{formatCompactNumber(value)}</span>
        </span>
    )
}

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(Number(value || 0))
}

function statusLabel(status?: string | null) {
    switch (status) {
        case 'completed':
            return 'Completed'
        case 'hiatus':
            return 'Hiatus'
        case 'draft':
            return 'Draft'
        case 'ongoing':
        default:
            return 'Ongoing'
    }
}

function normalizeGenres(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean)
    }

    if (typeof value !== 'string') {
        return []
    }

    const trimmed = value.trim()

    if (!trimmed) {
        return []
    }

    try {
        const decoded = JSON.parse(trimmed)

        if (Array.isArray(decoded)) {
            return decoded.map((item) => String(item).trim()).filter(Boolean)
        }
    } catch {
        // Supports comma-separated genre strings.
    }

    return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

function descriptionParagraphs(value: unknown): string[] {
    if (typeof value !== 'string') {
        return []
    }

    return value
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
}
