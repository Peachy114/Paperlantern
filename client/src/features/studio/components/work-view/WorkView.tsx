// features/studio/components/work-view/WorkView.tsx
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useStudioDashboard } from '@/features/studio/hooks/useStudioDashboard'
import CardStickyNotes from '@/features/studio/pages/CardStickyNotes'
import News from '@/features/announcements/components/News'
import BoostModal from '@/features/boosts/components/BoostModal'

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
import { Button } from '@/components/ui/button'
import Charts from '../../components/Index/Charts'
import WorkViewTable from './WorkViewTable'
import WorkViewHeader from './WorkViewHeader'
import WorkTypeSelectModal from './WorkTypeSelectModal'

export default function WorkView() {
    const queryClient = useQueryClient()
    const {
        works,
        showTypeSelect,
        selectedType,
        setShowTypeSelect,
        setSelectedType,
        handleDelete,
        handleConfirmType,
        navigate,
    } = useStudioDashboard()

    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
    const [boostWork, setBoostWork] = useState<(typeof works)[number] | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [selectedWorks, setSelectedWorks] = useState<string[]>([])

    const totalChapters = works.reduce((s, w) => s + w.chapters_count, 0)
    const totalViews = works.reduce((s, w) => s + w.views, 0)
    const pendingWork = works.find((w) => w.slug === pendingDeleteId) ?? null

    const confirmDelete = async () => {
        if (!pendingDeleteId) return
        setDeleting(true)
        try {
            await handleDelete(pendingDeleteId)
            toast.success('Work deleted.')
        } catch {
            toast.error('Failed to delete work.')
        } finally {
            setDeleting(false)
            setPendingDeleteId(null)
        }
    }

    const toggleSelectedWork = (slug: string) => {
        setSelectedWorks((current) =>
            current.includes(slug)
                ? current.filter((selected) => selected !== slug)
                : [...current, slug]
        )
    }

    const deleteSelectedWorks = async () => {
        if (selectedWorks.length === 0) return

        setDeleting(true)
        try {
            for (const slug of selectedWorks) {
                await handleDelete(slug)
            }
            toast.success(`${selectedWorks.length} work${selectedWorks.length === 1 ? '' : 's'} deleted.`)
            setSelectedWorks([])
        } catch {
            toast.error('Failed to delete selected works.')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="p-5 lg:dark:bg-white/4 lg:bg-muted/30 lg:border border-b-zinc-900 rounded-3xl">
            <News audience="studio" />
            <WorkViewHeader onNew={() => setShowTypeSelect(true)} onNavigate={navigate} />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { val: works.length, lbl: 'Works' },
                    { val: totalChapters, lbl: 'Chapters' },
                    { val: totalViews.toLocaleString(), lbl: 'Views' },
                ].map(({ val, lbl }) => (
                    <div key={lbl} className="border rounded-lg p-4">
                        <div className="text-2xl font-bold">{val}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{lbl}</div>
                    </div>
                ))}
            </div>

            {/* CHARTS AND STICKY NOTES */}
            <div className="flex flex-col lg:flex-row w-full items-stretch gap-4 mb-10">
                <div className="flex-1 min-w-0">
                    <Charts />
                </div>
                <div className="flex-1 min-w-0">
                    <CardStickyNotes />
                </div>
            </div>

            {/* Works list */}
            <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Works
                    </span>
                    {works.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                            <span className="text-muted-foreground">
                                {selectedWorks.length} selected
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedWorks(works.map((work) => work.slug))}
                                disabled={deleting || selectedWorks.length === works.length}
                            >
                                Select all
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedWorks([])}
                                disabled={deleting || selectedWorks.length === 0}
                            >
                                Unselect
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={deleteSelectedWorks}
                                disabled={deleting || selectedWorks.length === 0}
                            >
                                Delete selected
                            </Button>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground">{works.length} total</span>
                    )}
                </div>

                <WorkViewTable
                    works={works}
                    selectedSlugs={selectedWorks}
                    onSelectWork={toggleSelectedWork}
                    onNavigate={navigate}
                    onDeleteRequest={setPendingDeleteId}
                    onBoostRequest={setBoostWork}
                    onCreateFirst={() => setShowTypeSelect(true)}
                />
            </div>

            {boostWork && (
                <BoostModal
                    open={boostWork !== null}
                    onOpenChange={(open) => {
                        if (!open) setBoostWork(null)
                    }}
                    kind={boostWork.type === 'wattpad' ? 'novel' : 'webtoon'}
                    targetType="work"
                    targetId={boostWork.id}
                    title={boostWork.title}
                    placement={
                        boostWork.type === 'wattpad' ? 'Novel Explore' : 'Webtoon Explore'
                    }
                    onBoosted={() => queryClient.invalidateQueries({ queryKey: ['studio-works'] })}
                />
            )}

            {/* New Work Modal */}
            <WorkTypeSelectModal
                open={showTypeSelect}
                selectedType={selectedType}
                onSelectType={setSelectedType}
                onCancel={() => setShowTypeSelect(false)}
                onConfirm={handleConfirmType}
            />

            {/* Delete Confirmation */}
            <AlertDialog
                open={pendingDeleteId !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDeleteId(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this work?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingWork
                                ? `"${pendingWork.title}" and all its chapters will be permanently deleted. This cannot be undone.`
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
