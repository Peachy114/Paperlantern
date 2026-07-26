import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import formatCount from '@/utils/formatCount'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Lock, Heart } from 'lucide-react'

interface Chapter {
    id: string
    slug: string
    order: number
    title: string
    is_locked: boolean
    credits_required?: number
    likes: number
    created_at: string
    cover: string | null
}

interface PublicWorkChapterListProps {
    chapters: Chapter[]
    slug: string
    isOwner: boolean
    onChapterClick: (chapter: Chapter) => void
    coverUrl: (path: string | null, variant?: 'sm') => string | null
}

const CHAPTERS_PER_PAGE = 10

export default function PublicWorkChapterList({
    chapters,
    isOwner,
    coverUrl,
    onChapterClick,
}: PublicWorkChapterListProps) {
    const [visibleCount, setVisibleCount] = useState(CHAPTERS_PER_PAGE)

    if (chapters.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">No chapters yet...</p>
                </CardContent>
            </Card>
        )
    }

    const visibleChapters = chapters.slice(0, visibleCount)
    const remainingChapters = Math.max(chapters.length - visibleCount, 0)
    const nextChapterCount = Math.min(CHAPTERS_PER_PAGE, remainingChapters)
    const hasMoreChapters = remainingChapters > 0

    const handleLoadMore = () => {
        setVisibleCount((currentCount) =>
            Math.min(currentCount + CHAPTERS_PER_PAGE, chapters.length)
        )
    }

    return (
        // <Card>
        <div className="space-y-1">
            {visibleChapters.map((chapter) => (
                <button
                    key={chapter.id}
                    onClick={() => onChapterClick(chapter)}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-accent rounded-md transition-colors text-left group"
                >
                    {/* Thumbnail */}
                    {chapter.cover ? (
                        <img
                            src={coverUrl(chapter.cover, 'sm')!}
                            alt={chapter.title}
                            loading="lazy"
                            decoding="async"
                            className="w-8 h-11 sm:w-10 sm:h-14 object-cover rounded shrink-0"
                        />
                    ) : (
                        <div className="w-8 h-11 sm:w-10 sm:h-14 bg-muted rounded shrink-0" />
                    )}

                    {/* Chapter number */}
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                        CH.{chapter.order}
                    </span>

                    {/* Title — fills remaining space */}
                    <span className="text-sm truncate flex-1 min-w-0">{chapter.title}</span>

                    {/* Right side: badge + date — always shrink-0 */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {/* Right side: badge + date */}
                        <div className="flex items-center gap-2 shrink-0 ml-auto">
                            {chapter.is_locked && !isOwner && (
                                <Badge variant="destructive" className="gap-1 text-xs">
                                    <Lock className="w-3 h-3" />
                                    {chapter.credits_required}cr
                                </Badge>
                            )}
                            {chapter.likes > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                    <Heart className="w-3 h-3" />
                                    {formatCount(chapter.likes)}
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(chapter.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                </button>
            ))}

            {hasMoreChapters && (
                <div className="flex justify-center pt-4">
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        className="flex h-10 items-center justify-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-6 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100 dark:bg-sky-950/20 dark:text-sky-300 dark:hover:bg-sky-950/40"
                    >
                        <ChevronDown className="h-4 w-4" />
                        Load {nextChapterCount} more episode
                        {nextChapterCount === 1 ? '' : 's'}
                    </button>
                </div>
            )}
        </div>
        // </Card>
    )
}
