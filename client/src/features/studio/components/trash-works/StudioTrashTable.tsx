import StudioTrashWorkRow from './StudioTrashWorkRow'
import StudioTrashChapterRow from './StudioTrashChapterRow'
import { Button } from '@/components/ui/button'
import type { ConfirmAction } from './StudioTrashView'

interface Work {
    slug: string
    title: string
    type: 'webtoon' | 'wattpad'
    cover: string | null
    deleted_at: string
}

interface Chapter {
    slug: string
    title: string
    work_title: string
    cover: string | null
    deleted_at: string
}

interface Props {
    works: Work[]
    chapters: Chapter[]
    hasMoreWorks: boolean
    hasMoreChapters: boolean
    daysLeft: (deletedAt: string) => number
    onSetConfirm: (action: ConfirmAction) => void
    onLoadMoreWorks: () => void
    onLoadMoreChapters: () => void
}

export default function StudioTrashTable({
    works,
    chapters,
    hasMoreWorks,
    hasMoreChapters,
    daysLeft,
    onSetConfirm,
    onLoadMoreWorks,
    onLoadMoreChapters,
}: Props) {
    return (
        <div className="flex flex-col gap-6">
            {works.length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/50 border-b">
                        <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                            Works · {works.length}
                        </p>
                    </div>
                    {works.map((work) => (
                        <StudioTrashWorkRow
                            key={work.slug}
                            work={work}
                            daysLeft={daysLeft(work.deleted_at)}
                            onSetConfirm={onSetConfirm}
                        />
                    ))}
                    {hasMoreWorks && (
                        <div className="px-4 py-3 border-t">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground"
                                onClick={onLoadMoreWorks}
                            >
                                Load more
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {chapters.length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/50 border-b">
                        <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                            Chapters · {chapters.length}
                        </p>
                    </div>
                    {chapters.map((chapter) => (
                        <StudioTrashChapterRow
                            key={chapter.slug}
                            chapter={chapter}
                            daysLeft={daysLeft(chapter.deleted_at)}
                            onSetConfirm={onSetConfirm}
                        />
                    ))}
                    {hasMoreChapters && (
                        <div className="px-4 py-3 border-t">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground"
                                onClick={onLoadMoreChapters}
                            >
                                Load more
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
