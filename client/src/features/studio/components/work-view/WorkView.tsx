import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Bookmark, BookOpen, Eye, Heart, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useStudioDashboard } from '@/features/studio/hooks/useStudioDashboard'
import CardStickyNotes from '@/features/studio/pages/CardStickyNotes'
import News from '@/features/announcements/components/News'
import WorkspaceBannerPicker from '@/features/announcements/components/WorkspaceBannerPicker'
import BoostModal from '@/features/boosts/components/BoostModal'
import CreatorWorkspaceShell from '@/features/studio/components/workspace/CreatorWorkspaceShell'
import { storageUrl } from '@/utils/storage'
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
    const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false)
    const [boostWork, setBoostWork] = useState<(typeof works)[number] | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [selectedWorks, setSelectedWorks] = useState<string[]>([])
    const [selectionMode, setSelectionMode] = useState(false)
    const [workspaceBannerImage, setWorkspaceBannerImage] = useState<string | null>(null)

    const totalViews = works.reduce((sum, work) => sum + Number(work.views ?? 0), 0)
    const totalLikes = works.reduce((sum, work) => sum + Number(work.likes ?? 0), 0)
    const totalFavorites = works.reduce(
        (sum, work) => sum + Number(work.favorites_count ?? work.favorites ?? 0),
        0
    )
    const totalComments = works.reduce(
        (sum, work) => sum + Number(work.comments_count ?? work.comments ?? 0),
        0
    )
    const pendingWork = works.find((work) => work.slug === pendingDeleteId) ?? null
    const featuredWork = works.find((work) => work.cover) ?? works[0] ?? null
    const bannerImage = storageUrl(featuredWork?.cover ?? null)
    const activeBannerImage = workspaceBannerImage ?? bannerImage

    const dashboardStats = [
        {
            label: 'Work',
            value: works.length,
            icon: BookOpen,
            color: 'text-muted-foreground',
        },
        { label: 'Views', value: totalViews, icon: Eye, color: 'text-muted-foreground' },
        { label: 'Likes', value: totalLikes, icon: Heart, color: 'text-rose-500' },
        {
            label: 'Favorite',
            value: totalFavorites,
            icon: Bookmark,
            color: 'text-sky-400',
        },
        {
            label: 'Comments',
            value: totalComments,
            icon: MessageCircle,
            color: 'text-amber-400',
        },
    ]

    const confirmDelete = async () => {
        if (!pendingDeleteId) return

        setDeleting(true)
        try {
            await handleDelete(pendingDeleteId)
            setSelectedWorks((current) => current.filter((slug) => slug !== pendingDeleteId))
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
                toast.success(
                    `${selectedWorks.length} work${selectedWorks.length === 1 ? '' : 's'} deleted.`
                )
                setSelectedWorks([])
                setSelectionMode(false)
            } catch {
                toast.error('Failed to delete selected works.')
            } finally {
                setDeleting(false)
            }
        }

    return (
        <CreatorWorkspaceShell
            layout="dashboard"
            title="My Studio"
            description=""
            action={<WorkViewHeader onNew={() => setShowTypeSelect(true)} onNavigate={navigate} />}
        >
            <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-orange-50/60 p-2.5 shadow-sm sm:p-3">
                <div className="grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)]">
                    <News audience="studio" variant="dashboard" />

                    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                        <Charts />

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                            {dashboardStats.map(({ label, value, icon: Icon, color }) => (
                                <div
                                    key={label}
                                    className="rounded-xl border border-border bg-card px-3 py-3 shadow-sm"
                                >
                                    <div className={`flex items-center gap-1.5 ${color}`}>
                                        <Icon className="h-3.5 w-3.5" />
                                        <span className="text-[9px] font-bold">{label}</span>
                                    </div>
                                    <p className="mt-2 text-lg font-black leading-none text-foreground">
                                        {value.toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section
                className="relative mt-5 h-36 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-200 via-rose-100 to-sky-200 sm:h-48"
                aria-label="Featured creator banner"
            >
                <div className="absolute right-3 top-3 z-20">
                    <WorkspaceBannerPicker
                        audience="studio"
                        storageKey="workspace-banner-my-studio"
                        pageTarget="my_studio"
                        fallbackImage={bannerImage}
                        onImageChange={setWorkspaceBannerImage}
                    />
                </div>
                {activeBannerImage ? (
                    <img
                        src={activeBannerImage}
                        alt=""
                        className="absolute inset-0 h-full w-full scale-110 object-cover blur-[1px]"
                    />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/35 via-white/10 to-sky-500/30" />
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-6">
                    <p className="whitespace-nowrap text-5xl font-black italic tracking-tighter text-white/90 drop-shadow sm:text-7xl">
                        the extraordinary
                    </p>
                </div>
                {featuredWork ? (
                    <div className="absolute bottom-3 right-4 max-w-[45%] rounded-full bg-black/45 px-4 py-2 text-right text-[10px] font-bold text-white backdrop-blur">
                        {featuredWork.title}
                    </div>
                ) : null}
            </section>

            <section className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.12em]">My Works</h2>

                        {works.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                                {selectedWorks.length > 0 ? (
                                    <span className="mr-1 text-[10px] text-muted-foreground">
                                        {selectedWorks.length} selected
                                    </span>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectionMode(true)
                                        setSelectedWorks(works.map((work) => work.slug))
                                    }}
                                    disabled={deleting || selectedWorks.length === works.length}
                                    className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                >
                                    Select all
                                </button>
                                {selectedWorks.length > 0 ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedWorks([])
                                                setSelectionMode(false)
                                            }}
                                            disabled={deleting}
                                            className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                        >
                                            Clear
                                        </button>
                                        <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
                                        <button
                                            type="button"
                                            onClick={() => setConfirmingBulkDelete(true)}
                                            disabled={deleting}
                                            className="rounded-full bg-rose-500 px-3 py-1 text-[9px] font-bold text-white transition hover:bg-rose-600 disabled:opacity-40"
                                        >
                                            Delete selected
                                        </button>
                                    </>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <AlertDialog
                open={confirmingBulkDelete}
                onOpenChange={(open) => {
                    if (!open) setConfirmingBulkDelete(false)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {selectedWorks.length} work{selectedWorks.length === 1 ? '' : 's'}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            These works and all their chapters will be permanently deleted. This
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                await deleteSelectedWorks()
                                setConfirmingBulkDelete(false)
                            }}
                            disabled={deleting}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

                    <WorkViewTable
                        works={works}
                        selectedSlugs={selectedWorks}
                        selectionMode={selectionMode}
                        onSelectWork={toggleSelectedWork}
                        onNavigate={navigate}
                        onDeleteRequest={setPendingDeleteId}
                        onBoostRequest={setBoostWork}
                        onCreateFirst={() => setShowTypeSelect(true)}
                    />
                </div>

                <CardStickyNotes />
            </section>

            {boostWork ? (
                <BoostModal
                    open={boostWork !== null}
                    onOpenChange={(open) => {
                        if (!open) setBoostWork(null)
                    }}
                    kind={boostWork.type === 'wattpad' ? 'novel' : 'webtoon'}
                    targetType="work"
                    targetId={boostWork.id}
                    title={boostWork.title}
                    placement={boostWork.type === 'wattpad' ? 'Novel Explore' : 'Webtoon Explore'}
                    onBoosted={() => queryClient.invalidateQueries({ queryKey: ['studio-works'] })}
                />
            ) : null}

            <WorkTypeSelectModal
                open={showTypeSelect}
                selectedType={selectedType}
                onSelectType={setSelectedType}
                onCancel={() => setShowTypeSelect(false)}
                onConfirm={handleConfirmType}
            />

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
                                ? `"${pendingWork.title}" and all its chapters will be deleted. You can restore them
                            from Trash later.`
                                : 'You can restore them from Trash later.'}
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
        </CreatorWorkspaceShell>
    )
}
