import { useState } from 'react'
import { toast } from 'sonner'
import { useChapterIndex } from '@/features/studio/hooks/useChapterIndex'
import ChapterManageImage from './ChapterManageImage'
import ChapterManageHeader from './ChapterManageHeader'
import ChapterManageStats from './ChapterManageStats'
import ChapterManageListTable from './ChapterManageListsTable'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ChapterManageView() {
    const { work, chapters, navigate, workSlug, handleDelete } = useChapterIndex()
    const [pendingDeleteSlug, setPendingDeleteSlug] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    const pendingChapter = chapters.find((c) => c.slug === pendingDeleteSlug) ?? null

    const totalViews = chapters.reduce((s, c) => s + c.views, 0)
    const totalLikes = chapters.reduce((s, c) => s + (c.likes ?? 0), 0)

    const confirmDelete = async () => {
        if (!pendingDeleteSlug) return
        setDeleting(true)
        try {
            await handleDelete(pendingDeleteSlug)
            toast.success('Chapter deleted.')
        } catch {
            toast.error('Failed to delete chapter. Please try again.')
        } finally {
            setDeleting(false)
            setPendingDeleteSlug(null)
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <ChapterManageHeader
                workTitle={work?.title}
                workType={work?.type}
                workSlug={workSlug ?? ''}
                navigate={navigate}
            />

            <ChapterManageImage banner={work?.banner} title={work?.title} />

            <ChapterManageStats
                chapterCount={chapters.length}
                totalViews={totalViews}
                totalLikes={totalLikes}
            />

            <ChapterManageListTable
                chapters={chapters}
                workSlug={workSlug ?? ''}
                navigate={navigate}
                onDelete={(slug) => setPendingDeleteSlug(slug)}
            />

            <AlertDialog
                open={pendingDeleteSlug !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPendingDeleteSlug(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete chapter?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingChapter
                                ? `"${pendingChapter.title}" will be permanently deleted.`
                                : 'This action cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
