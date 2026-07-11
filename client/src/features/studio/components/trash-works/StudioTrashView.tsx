import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useStudioTrash } from '@/features/studio/hooks/useStudioTrash'

import StudioTrashEmpty from './StudioTrashEmpty'
import StudioTrashTable from './StudioTrashTable'
import StudioTrashConfirmDialog from './StudioTrashConfirmDialog'

export type ConfirmAction =
    | { type: 'restore-work'; slug: string; title: string }
    | { type: 'force-work'; slug: string; title: string }
    | { type: 'restore-chapter'; slug: string; title: string }
    | { type: 'force-chapter'; slug: string; title: string }
    | null

export default function StudioTrashView() {
    const navigate = useNavigate()
    const {
        works,
        chapters,
        restoreWork,
        forceDeleteWork,
        restoreChapter,
        forceDeleteChapter,
        hasMoreChapters,
        hasMoreWorks,
        loadMoreWorks,
        loadMoreChapters,
    } = useStudioTrash()

    const [confirm, setConfirm] = useState<ConfirmAction>(null)
    const [acting, setActing] = useState(false)

    const daysLeft = (deletedAt: string) => {
        const expires = new Date(new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
        return Math.max(0, Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    }

    const handleConfirm = async () => {
        if (!confirm) return
        setActing(true)
        try {
            if (confirm.type === 'restore-work') {
                await restoreWork(confirm.slug)
                toast.success(`"${confirm.title}" restored.`)
            } else if (confirm.type === 'force-work') {
                await forceDeleteWork(confirm.slug)
                toast.success(`"${confirm.title}" permanently deleted.`)
            } else if (confirm.type === 'restore-chapter') {
                await restoreChapter(confirm.slug)
                toast.success(`"${confirm.title}" restored.`)
            } else if (confirm.type === 'force-chapter') {
                await forceDeleteChapter(confirm.slug)
                toast.success(`"${confirm.title}" permanently deleted.`)
            }
        } catch {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setActing(false)
            setConfirm(null)
        }
    }

    const isEmpty = works.length === 0 && chapters.length === 0

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 text-muted-foreground hover:text-foreground mb-1"
                        onClick={() => navigate('/studio')}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Studio
                    </Button>
                    <h1 className="text-xl font-bold">Trash</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Items are permanently deleted after 30 days.
                    </p>
                </div>
            </div>

            <Separator className="mb-6" />

            {isEmpty ? (
                <StudioTrashEmpty />
            ) : (
                <StudioTrashTable
                    works={works}
                    chapters={chapters}
                    hasMoreWorks={hasMoreWorks}
                    hasMoreChapters={hasMoreChapters}
                    daysLeft={daysLeft}
                    onSetConfirm={setConfirm}
                    onLoadMoreWorks={loadMoreWorks}
                    onLoadMoreChapters={loadMoreChapters}
                />
            )}

            <StudioTrashConfirmDialog
                confirm={confirm}
                acting={acting}
                onConfirm={handleConfirm}
                onClose={() => setConfirm(null)}
            />
        </div>
    )
}
