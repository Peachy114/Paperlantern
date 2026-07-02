import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import formatCount from '@/utils/formatCount'
import { Badge } from '@/components/ui/badge'
import { Lock, Heart } from 'lucide-react'

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

export default function PublicWorkChapterList({
    chapters,
    isOwner,
    coverUrl,
    onChapterClick,
}: PublicWorkChapterListProps) {
    if (chapters.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">No chapters yet...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {chapters.map((chapter) => (
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
                </div>
            </CardContent>
        </Card>
    )
}
