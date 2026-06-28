import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

interface WorkCardProps {
    id: number
    slug?: string
    title: string
    cover: string | null
    type?: 'webtoon' | 'wattpad'
    genres?: string[]
    status?: string
    likes?: number
    rank?: number
    showStats?: boolean
    lastChapterAt?: string | Date | null // ← new prop
}

function isNewThisWeek(date?: string | Date | null): boolean {
    if (!date) return false
    const posted = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - posted.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays <= 7
}

export default function WorkCard({
    id,
    slug,
    title,
    cover,
    type,
    genres,
    status,
    likes,
    rank,
    showStats,
    lastChapterAt,
}: WorkCardProps) {
    const hasNewChapter = isNewThisWeek(lastChapterAt)

    return (
        <Link to={`/works/${slug ?? id}`} className="group block">
            <div className="aspect-[3/4] w-full bg-muted relative overflow-hidden rounded-md">
                {cover ? (
                    <img src={cover} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Cover
                    </div>
                )}

                {rank !== undefined && (
                    <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center">
                        {rank}
                    </span>
                )}

                {type && (
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--comix-badge-type)] text-white capitalize">
                        {type}
                    </span>
                )}

                {/* ✦ New Chapter badge — stacks below the type badge */}
                {hasNewChapter && (
                    <span className="absolute top-7 left-1.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--comix-badge-new)] text-white">
                        ✦ New Chapter
                    </span>
                )}

                {status && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold px-2 py-0.5 rounded text-white bg-[var(--comix-accent)] capitalize">
                        {status}
                    </span>
                )}
            </div>

            <div className="mt-2">
                <p className="text-sm font-bold leading-snug line-clamp-2">{title}</p>

                {genres && genres.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {genres.slice(0, 2).join(' · ')}
                    </p>
                )}

                {showStats && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                        {(likes ?? 0).toLocaleString()}
                    </p>
                )}
            </div>
        </Link>
    )
}
