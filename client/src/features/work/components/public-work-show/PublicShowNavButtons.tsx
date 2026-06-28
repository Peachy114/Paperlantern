import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import type { ChapterListItem } from '@/types/chapter'

interface PublicShowNavButtonsProps {
    prevChapter: ChapterListItem | null
    nextChapter: ChapterListItem | null
    isOwner: boolean
    goTo: (slug: string) => void
    openUnlockModal: (chapter: ChapterListItem, navigateTo: string) => void
}

export default function PublicShowNavButtons({
    prevChapter,
    nextChapter,
    isOwner,
    goTo,
    openUnlockModal,
}: PublicShowNavButtonsProps) {
    return (
        <div className="flex items-center justify-between py-3 gap-2 border-t mt-2">
            {prevChapter ? (
                prevChapter.is_locked && !isOwner ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUnlockModal(prevChapter, prevChapter.slug)}
                        className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
                    >
                        <Lock className="w-3 h-3" />
                        <span className="hidden xs:inline">
                            {prevChapter.credits_required}cr ·{' '}
                        </span>
                        Unlock Prev
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goTo(prevChapter.slug)}
                        className="gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                    </Button>
                )
            ) : (
                <div />
            )}

            {nextChapter ? (
                nextChapter.is_locked && !isOwner ? (
                    <Button
                        size="sm"
                        onClick={() => openUnlockModal(nextChapter, nextChapter.slug)}
                        className="gap-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-900 border border-amber-500"
                    >
                        <Lock className="w-3 h-3" />
                        <span className="hidden xs:inline">
                            {nextChapter.credits_required}cr ·{' '}
                        </span>
                        Unlock Next
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goTo(nextChapter.slug)}
                        className="gap-1"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                )
            ) : (
                <div />
            )}
        </div>
    )
}
