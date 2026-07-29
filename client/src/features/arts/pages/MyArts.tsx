import {
    useState,
    type ChangeEvent,
    type FormEvent,
    type KeyboardEvent,
    type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Eye,
    Heart,
    ImageOff,
    Images,
    Info,
    type LucideIcon,
    MessageCircle,
    MoreHorizontal,
    Pencil,
    PlusCircle,
    RotateCcw,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react'
import News from '@/features/announcements/components/News'
import WorkspaceBannerPicker from '@/features/announcements/components/WorkspaceBannerPicker'
import { useMyArts } from '@/features/arts/hooks/useMyArts'
import BoostModal from '@/features/boosts/components/BoostModal'
import CommentSection from '@/features/comments/components/CommentSection'
import CreatorWorkspaceShell from '@/features/studio/components/workspace/CreatorWorkspaceShell'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import type { Art, ArtStatus } from '@/types/art'
import { Button } from '@/components/ui/button'
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

type ImageDraft = {
    file: File
    preview: string
    description: string
}

type FormState = {
    title: string
    description: string
    labels: string[]
    labelInput: string
    status: ArtStatus
    applyWatermark: boolean
    images: ImageDraft[]
}

type ConfirmState =
    | { type: 'trash'; art: Art }
    | { type: 'restore'; art: Art }
    | { type: 'force'; art: Art }
    | null

const EMPTY_FORM: FormState = {
    title: '',
    description: '',
    labels: [],
    labelInput: '',
    status: 'published',
    applyWatermark: true,
    images: [],
}

const STATUS_COLOR: Record<ArtStatus, string> = {
    draft: 'text-gray-400',
    published: 'text-green-500',
    archived: 'text-yellow-500',
}

export default function MyArts() {
    const queryClient = useQueryClient()
    const {
        arts,
        stats,
        viewsChart,
        trashedArts,
        trashLoading,
        createArt,
        updateArt,
        trashArt,
        restoreArt,
        forceDeleteArt,
    } = useMyArts()

    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Art | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [confirm, setConfirm] = useState<ConfirmState>(null)
    const [boostArt, setBoostArt] = useState<Art | null>(null)
    const [viewArt, setViewArt] = useState<Art | null>(null)
    const [selectedArts, setSelectedArts] = useState<string[]>([])
    const [activeSection, setActiveSection] = useState('arts')
    const [workspaceBannerImage, setWorkspaceBannerImage] = useState<string | null>(null)

    const featuredArt = arts.find((art) => getFirstImagePath(art)) ?? arts[0] ?? null
    const featuredImage = featuredArt ? storageUrl(getFirstImagePath(featuredArt)) : null
    const activeBannerImage = workspaceBannerImage ?? featuredImage

    const statCards = [
        { label: 'Arts', value: stats.arts, icon: Images, color: 'text-slate-700' },
        { label: 'Views', value: stats.views, icon: Eye, color: 'text-slate-700' },
        { label: 'Likes', value: stats.likes, icon: Heart, color: 'text-rose-500' },
        {
            label: 'Super Likes',
            value: stats.super_likes,
            icon: Sparkles,
            color: 'text-amber-400',
        },
        {
            label: 'Comments',
            value: stats.comments,
            icon: MessageCircle,
            color: 'text-orange-500',
        },
    ]

    const openCreate = () => {
        setEditing(null)
        setForm(EMPTY_FORM)
        setFormOpen(true)
    }

    const openEdit = (art: Art) => {
        setEditing(art)
        setForm({
            title: art.title,
            description: art.description ?? '',
            labels: art.labels ?? [],
            labelInput: '',
            status: art.status,
            applyWatermark: art.apply_watermark ?? true,
            images: [],
        })
        setFormOpen(true)
    }

    const handleImages = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []).slice(0, 10)
        setForm((current) => ({
            ...current,
            images: files.map((file) => ({
                file,
                preview: URL.createObjectURL(file),
                description: '',
            })),
        }))
    }

    const updateImageDescription = (index: number, description: string) => {
        setForm((current) => ({
            ...current,
            images: current.images.map((image, imageIndex) =>
                imageIndex === index ? { ...image, description } : image
            ),
        }))
    }

    const buildPayload = () => {
        const payload = new FormData()

        payload.append('title', form.title.trim())
        payload.append('description', form.description.trim())
        payload.append('status', form.status)
        payload.append('download_policy', 'disabled')
        payload.append('apply_watermark', form.applyWatermark ? '1' : '0')
        form.labels.forEach((label) => payload.append('labels[]', label))
        form.images.forEach((image) => {
            payload.append('images[]', image.file)
            payload.append('image_descriptions[]', image.description)
        })

        return payload
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!form.title.trim()) {
            toast.error('Title is required.')
            return
        }

        if (!editing && form.images.length === 0) {
            toast.error('Add at least one image.')
            return
        }

        try {
            if (editing) {
                await updateArt.mutateAsync({
                    slug: editing.slug,
                    payload: buildPayload(),
                })
                toast.success('Art post updated.')
            } else {
                await createArt.mutateAsync(buildPayload())
                toast.success('Art post published.')
            }
            setFormOpen(false)
        } catch {
            toast.error('Could not save art post.')
        }
    }

    const handleConfirm = async () => {
        if (!confirm) return

        try {
            if (confirm.type === 'trash') {
                await trashArt.mutateAsync(confirm.art.slug)
                toast.success('Art post moved to trash.')
            }
            if (confirm.type === 'restore') {
                await restoreArt.mutateAsync(confirm.art.slug)
                toast.success('Art post restored.')
            }
            if (confirm.type === 'force') {
                await forceDeleteArt.mutateAsync(confirm.art.slug)
                toast.success('Art post permanently deleted.')
            }
            setConfirm(null)
        } catch {
            toast.error('Something went wrong. Please try again.')
        }
    }

    const toggleSelectedArt = (id: string) => {
        setSelectedArts((current) =>
            current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id]
        )
    }

    const clearSelectedArts = () => setSelectedArts([])

    const trashSelectedArts = async () => {
        const selected = arts.filter((art) => selectedArts.includes(art.id))
        if (selected.length === 0) return

        try {
            for (const art of selected) {
                await trashArt.mutateAsync(art.slug)
            }
            toast.success(
                `${selected.length} art post${selected.length === 1 ? '' : 's'} moved to trash.`
            )
            clearSelectedArts()
        } catch {
            toast.error('Could not move selected art posts to trash.')
        }
    }

    const daysLeft = (deletedAt?: string | null) => {
        if (!deletedAt) return 30
        const expires = new Date(new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
        return Math.max(0, Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    }

    const acting =
        trashArt.isPending ||
        restoreArt.isPending ||
        forceDeleteArt.isPending ||
        createArt.isPending ||
        updateArt.isPending

    return (
        <CreatorWorkspaceShell
            layout="dashboard"
            title="Arts"
            description=""
            action={
                <div className="flex items-center gap-2">
                    {activeSection === 'trash' ? (
                        <button
                            type="button"
                            onClick={() => setActiveSection('arts')}
                            className="inline-flex h-8 items-center rounded-full border border-sky-200 bg-white px-4 text-xs font-bold text-sky-600 shadow-sm transition hover:bg-sky-50"
                        >
                            Back to Arts
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-400 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-sky-500"
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Add Artwork
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() =>
                            setActiveSection((current) => (current === 'trash' ? 'arts' : 'trash'))
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-400 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-sky-500"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        {activeSection === 'trash' ? 'Arts' : 'Trash'}
                    </button>
                </div>
            }
        >
            {activeSection === 'trash' ? (
                <StudioPanel title="Trash" count={trashedArts.length}>
                    {trashLoading ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : trashedArts.length === 0 ? (
                        <EmptyState icon={Trash2} title="Trash is empty" />
                    ) : (
                        <TrashTable
                            arts={trashedArts}
                            daysLeft={daysLeft}
                            onRestore={(art) => setConfirm({ type: 'restore', art })}
                            onForceDelete={(art) => setConfirm({ type: 'force', art })}
                        />
                    )}
                </StudioPanel>
            ) : (
                <>
                    <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-orange-50/60 p-2.5 shadow-sm sm:p-3">
                        <div className="grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)]">
                            <News audience="studio" variant="dashboard" />

                            <div className="rounded-2xl border border-slate-200 bg-background p-4 shadow-sm">
                                <ArtsActivityChart points={viewsChart} />

                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                                    {statCards.map(({ label, value, icon: Icon, color }) => (
                                        <div
                                            key={label}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                                        >
                                            <div className={`flex items-center gap-1.5 ${color}`}>
                                                <Icon className="h-3.5 w-3.5" />
                                                <span className="text-[9px] font-bold">
                                                    {label}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-lg font-black leading-none text-slate-900">
                                                {value.toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="relative mt-5 h-36 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-200 via-rose-100 to-sky-200 sm:h-52">
                        <div className="absolute right-3 top-3 z-20">
                            <WorkspaceBannerPicker
                                audience="studio"
                                storageKey="workspace-banner-my-arts"
                                pageTarget="my_arts"
                                fallbackImage={featuredImage}
                                onImageChange={setWorkspaceBannerImage}
                            />
                        </div>
                        {activeBannerImage ? (
                            <img
                                src={activeBannerImage}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover object-center"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(251,146,60,0.5),transparent_30%),radial-gradient(circle_at_75%_50%,rgba(56,189,248,0.45),transparent_35%)]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10" />
                        {featuredArt ? (
                            <div className="absolute bottom-3 right-4 max-w-[55%] rounded-full bg-black/45 px-4 py-2 text-right text-[10px] font-bold text-white backdrop-blur">
                                {featuredArt.title}
                            </div>
                        ) : null}
                    </section>

                    <section className="mt-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-xs font-black uppercase tracking-[0.12em]">
                                My Arts
                            </h2>

                            {arts.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {selectedArts.length > 0 ? (
                                        <span className="mr-1 text-[10px] text-muted-foreground">
                                            {selectedArts.length} selected
                                        </span>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedArts(arts.map((art) => art.id))}
                                        disabled={acting || selectedArts.length === arts.length}
                                        className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                    >
                                        Select all
                                    </button>
                                    {selectedArts.length > 0 ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={clearSelectedArts}
                                                disabled={acting}
                                                className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={trashSelectedArts}
                                                disabled={acting}
                                                className="rounded-full bg-rose-500 px-3 py-1 text-[9px] font-bold text-white transition hover:bg-rose-600 disabled:opacity-40"
                                            >
                                                Delete selected
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>

                        {arts.length === 0 ? (
                            <EmptyState
                                icon={Images}
                                title="No art posts yet"
                                actionLabel="Add artwork"
                                onAction={openCreate}
                            />
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {arts.map((art) => (
                                    <ArtDashboardCard
                                        key={art.id}
                                        art={art}
                                        selected={selectedArts.includes(art.id)}
                                        onSelect={toggleSelectedArt}
                                        onView={setViewArt}
                                        onEdit={openEdit}
                                        onBoost={setBoostArt}
                                        onTrash={(selected) =>
                                            setConfirm({ type: 'trash', art: selected })
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Art Post' : 'Add Art Post'}</DialogTitle>
                            <DialogDescription>
                                Add labels, a description, and up to 10 images.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="art-title">Post title</Label>
                                <Input
                                    id="art-title"
                                    value={form.title}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Label htmlFor="art-labels">Labels</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {form.labels.length}/12 labels
                                    </span>
                                </div>
                                <LabelBadgeInput
                                    labels={form.labels}
                                    input={form.labelInput}
                                    onInputChange={(labelInput) =>
                                        setForm((current) => ({ ...current, labelInput }))
                                    }
                                    onChange={(labels) =>
                                        setForm((current) => ({ ...current, labels }))
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="art-description">Description</Label>
                                <Textarea
                                    id="art-description"
                                    rows={4}
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="art-status">Status</Label>
                                <select
                                    id="art-status"
                                    value={form.status}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            status: event.target.value as ArtStatus,
                                        }))
                                    }
                                    className="h-9 rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
                                <label
                                    htmlFor="art-apply-watermark"
                                    className="flex items-start gap-3 rounded-md border bg-background p-3 text-sm"
                                >
                                    <input
                                        id="art-apply-watermark"
                                        type="checkbox"
                                        checked={form.applyWatermark}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                applyWatermark: event.target.checked,
                                            }))
                                        }
                                        className="mt-1"
                                    />
                                    <span className="grid gap-1">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            Apply watermark to public preview
                                            <Info
                                                className="h-3.5 w-3.5 text-muted-foreground"
                                                aria-label="Watermark help"
                                            >
                                                <title>
                                                    Watermark protects the public art preview.
                                                </title>
                                            </Info>
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Turn this off only when you want the public art image to
                                            show without the site watermark.
                                        </span>
                                    </span>
                                </label>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="art-images">Images</Label>
                                {editing && form.images.length === 0 && (
                                    <ExistingImagesPreview art={editing} />
                                )}
                                {form.images.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {form.images.map((image, index) => (
                                            <div
                                                key={`${image.file.name}-${index}`}
                                                className="w-48 shrink-0 border rounded-lg overflow-hidden bg-background"
                                            >
                                                <div className="aspect-square bg-muted">
                                                    <img
                                                        src={image.preview}
                                                        alt={`Selected art ${index + 1}`}
                                                        className="h-full w-full object-contain"
                                                    />
                                                </div>
                                                <Textarea
                                                    rows={2}
                                                    value={image.description}
                                                    placeholder="Image description"
                                                    className="rounded-none border-0 border-t"
                                                    onChange={(event) =>
                                                        updateImageDescription(
                                                            index,
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Input
                                    id="art-images"
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={handleImages}
                                />
                                <p className="text-xs text-muted-foreground">
                                    New uploads replace the current image set when editing.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                                disabled={acting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={acting}>
                                {acting ? 'Saving...' : editing ? 'Save Post' : 'Post Art'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={confirm !== null}
                onOpenChange={(open) => {
                    if (!open) setConfirm(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmTitle(confirm)}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDescription(confirm)}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={acting}
                            className={
                                confirm?.type === 'force'
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : undefined
                            }
                        >
                            {acting ? 'Working...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {boostArt && (
                <BoostModal
                    open={boostArt !== null}
                    onOpenChange={(open) => {
                        if (!open) setBoostArt(null)
                    }}
                    kind="art"
                    targetType="art"
                    targetId={boostArt.id}
                    title={boostArt.title}
                    placement="Arts Explore"
                    onBoosted={() => queryClient.invalidateQueries({ queryKey: ['studio-arts'] })}
                />
            )}

            <ArtViewDialog
                art={viewArt}
                open={Boolean(viewArt)}
                onOpenChange={(open) => {
                    if (!open) setViewArt(null)
                }}
            />
        </CreatorWorkspaceShell>
    )
}

function ArtsActivityChart({ points }: { points: Array<{ date: string; views: number }> }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const width = 720
    const height = 190
    const baseline = 148
    const chartTop = 34
    const left = 28
    const right = width - 28
    const max = Math.max(...points.map((point) => Number(point.views)), 1)
    const step = (right - left) / Math.max(points.length - 1, 1)

    const normalizedPoints = points.map((point) => {
        const date = new Date(`${point.date}T00:00:00`)

        return {
            ...point,
            views: Number(point.views) || 0,
            label: Number.isNaN(date.getTime())
                ? point.date
                : date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                  }),
            fullLabel: Number.isNaN(date.getTime())
                ? point.date
                : date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                  }),
        }
    })
    const coordinates = normalizedPoints.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point.views / max) * (baseline - chartTop),
    }))
    const linePath = createArtsChartPath(coordinates)
    const first = coordinates[0]
    const last = coordinates[coordinates.length - 1]
    const areaPath =
        first && last ? `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z` : ''
    const activePoint = activeIndex === null ? null : normalizedPoints[activeIndex]
    const activeCoordinate = activeIndex === null ? null : coordinates[activeIndex]
    const totalViews = normalizedPoints.reduce((sum, point) => sum + point.views, 0)
    const hasViews = normalizedPoints.some((point) => point.views > 0)

    return (
        <div>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">
                        Views
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Last seven days · views across all your artwork
                    </p>
                </div>
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                    {totalViews.toLocaleString()} total views
                </span>
            </div>

            <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-background to-sky-50/65">
                <div className="pointer-events-none absolute right-3 top-2 z-10 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-background/90 px-2.5 py-1 text-[9px] font-bold text-muted-foreground shadow-sm backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    Views
                </div>

                {activePoint && activeCoordinate ? (
                    <div
                        className={`pointer-events-none absolute top-8 z-20 min-w-32 rounded-xl border border-slate-200/80 bg-background/95 px-3 py-2 text-[10px] shadow-xl backdrop-blur ${
                            activeIndex === 0
                                ? 'translate-x-0'
                                : activeIndex === normalizedPoints.length - 1
                                  ? '-translate-x-full'
                                  : '-translate-x-1/2'
                        }`}
                        style={{ left: `${(activeCoordinate.x / width) * 100}%` }}
                    >
                        <p className="font-black text-foreground">{activePoint.fullLabel}</p>
                        <div className="mt-1.5 flex items-center justify-between gap-5 text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-sky-400" />
                                Views
                            </span>
                            <strong className="text-foreground">
                                {activePoint.views.toLocaleString()}
                            </strong>
                        </div>
                    </div>
                ) : null}

                {!hasViews ? (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pt-5 text-xs font-semibold text-muted-foreground">
                        No art views during the last seven days.
                    </div>
                ) : null}

                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-full w-full"
                    role="img"
                    aria-label="Art views during the last seven days"
                    onMouseLeave={() => setActiveIndex(null)}
                >
                    {[0, 1, 2, 3].map((lineIndex) => {
                        const y = chartTop + lineIndex * ((baseline - chartTop) / 3)

                        return (
                            <line
                                key={lineIndex}
                                x1={left}
                                x2={right}
                                y1={y}
                                y2={y}
                                stroke="currentColor"
                                strokeDasharray="3 5"
                                className="text-slate-200/90"
                            />
                        )
                    })}

                    <defs>
                        <linearGradient id="arts-views-fill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.58" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
                        </linearGradient>
                    </defs>

                    <path d={areaPath} fill="url(#arts-views-fill)" />
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {activeCoordinate ? (
                        <line
                            x1={activeCoordinate.x}
                            x2={activeCoordinate.x}
                            y1={chartTop}
                            y2={baseline}
                            stroke="#94a3b8"
                            strokeWidth="1"
                            strokeDasharray="3 4"
                        />
                    ) : null}

                    {normalizedPoints.map((point, index) => {
                        const coordinate = coordinates[index]
                        const hitLeft =
                            index === 0
                                ? left
                                : coordinate.x - (normalizedPoints.length > 1 ? step / 2 : 0)
                        const hitRight =
                            index === normalizedPoints.length - 1
                                ? right
                                : coordinate.x +
                                  (normalizedPoints.length > 1 ? step / 2 : right - left)
                        const active = activeIndex === index

                        return (
                            <g key={`${point.date}-${index}`}>
                                <circle
                                    cx={coordinate.x}
                                    cy={coordinate.y}
                                    r={active ? 5 : 3.5}
                                    fill="#ffffff"
                                    stroke="#38bdf8"
                                    strokeWidth="2"
                                    className="pointer-events-none transition-all"
                                />
                                <text
                                    x={coordinate.x}
                                    y={176}
                                    textAnchor="middle"
                                    className="pointer-events-none fill-slate-400 text-[8px]"
                                >
                                    {point.label}
                                </text>
                                <rect
                                    x={hitLeft}
                                    y={chartTop}
                                    width={hitRight - hitLeft}
                                    height={baseline - chartTop + 12}
                                    fill="transparent"
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`${point.fullLabel}: ${point.views.toLocaleString()} views`}
                                    className="cursor-crosshair outline-none"
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onFocus={() => setActiveIndex(index)}
                                    onBlur={() => setActiveIndex(null)}
                                />
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}

function createArtsChartPath(points: Array<{ x: number; y: number }>) {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

    return points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`

        const previous = points[index - 1]
        const controlX = (previous.x + point.x) / 2

        return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
    }, '')
}

function ArtDashboardCard({
    art,
    selected,
    onSelect,
    onView,
    onEdit,
    onBoost,
    onTrash,
}: {
    art: Art
    selected: boolean
    onSelect: (id: string) => void
    onView: (art: Art) => void
    onEdit: (art: Art) => void
    onBoost: (art: Art) => void
    onTrash: (art: Art) => void
}) {
    const image = storageUrl(getFirstImagePath(art))
    const labels = art.labels ?? []

    return (
        <article
            className={`group overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-slate-200'
            }`}
        >
            <div className="relative aspect-square overflow-hidden bg-muted">
                <button
                    type="button"
                    onClick={() => onView(art)}
                    className="h-full w-full"
                    aria-label={`View ${art.title}`}
                >
                    {image ? (
                        <img
                            src={image}
                            alt={art.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <span className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 via-rose-100 to-sky-100">
                            <ImageOff className="h-8 w-8 text-slate-400" />
                        </span>
                    )}
                </button>

                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-white/90 px-2 py-1 text-[9px] font-bold capitalize text-slate-700 shadow-sm backdrop-blur">
                        {art.status}
                    </span>
                    {art.boosted_until ? (
                        <span className="rounded-full bg-rose-400 px-2 py-1 text-[9px] font-bold text-white shadow-sm">
                            Boosted
                        </span>
                    ) : null}
                </div>

                <label className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onSelect(art.id)}
                        className="h-4 w-4 accent-sky-500"
                        aria-label={`Select ${art.title}`}
                    />
                </label>
            </div>

            <div className="p-2.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <button
                            type="button"
                            onClick={() => onView(art)}
                            className="line-clamp-2 min-h-8 w-full text-left text-xs font-black leading-[1.35] hover:text-sky-500"
                        >
                            {art.title}
                        </button>
                        <p className="mt-1 truncate text-[9px] font-semibold text-orange-500">
                            {art.user?.name ?? 'Artist'}
                        </p>
                    </div>
                    <ArtActions
                        art={art}
                        onView={onView}
                        onEdit={onEdit}
                        onBoost={onBoost}
                        onTrash={onTrash}
                    />
                </div>

                {art.description ? (
                    <p className="mt-2 line-clamp-2 min-h-7 text-[9px] leading-relaxed text-muted-foreground">
                        {art.description}
                    </p>
                ) : null}

                {labels.length > 0 ? (
                    <div className="mt-2 flex min-h-4 flex-wrap gap-1">
                        {labels.slice(0, 2).map((label) => (
                            <span
                                key={label}
                                className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] text-muted-foreground"
                            >
                                #{label}
                            </span>
                        ))}
                    </div>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[8px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Eye className="h-2.5 w-2.5" />
                        {art.views.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-500">
                        <Heart className="h-2.5 w-2.5 fill-current" />
                        {art.likes.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-2.5 w-2.5" />
                        {art.comments_count.toLocaleString()}
                    </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <button
                        type="button"
                        onClick={() => onEdit(art)}
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-rose-400 text-[9px] font-bold text-white transition hover:bg-rose-500"
                    >
                        <Pencil className="h-2.5 w-2.5" />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onBoost(art)}
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-sky-400 text-[9px] font-bold text-white transition hover:bg-sky-500"
                    >
                        <Sparkles className="h-2.5 w-2.5" />
                        Boost
                    </button>
                </div>
            </div>
        </article>
    )
}

function StudioPanel({
    title,
    count,
    action,
    children,
}: {
    title: string
    count?: number
    action?: ReactNode
    children: ReactNode
}) {
    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {title}
                </span>
                {action ?? (
                    <span className="text-xs text-muted-foreground">
                        {count?.toLocaleString() ?? 0} total
                    </span>
                )}
            </div>
            {children}
        </div>
    )
}

function ArtPostRow({
    art,
    selected,
    onSelect,
    onView,
    onEdit,
    onBoost,
    onTrash,
}: {
    art: Art
    selected: boolean
    onSelect: (id: string) => void
    onView: (art: Art) => void
    onEdit: (art: Art) => void
    onBoost: (art: Art) => void
    onTrash: (art: Art) => void
}) {
    const labels = art.labels ?? []
    const statusColor = STATUS_COLOR[art.status] ?? 'text-gray-400'

    return (
        <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
                <label className="flex items-start pt-1">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onSelect(art.id)}
                        className="h-4 w-4 rounded border-muted-foreground/40"
                        aria-label={`Select ${art.title}`}
                    />
                </label>
                <ArtImageCarousel art={art} />

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="font-medium text-sm leading-snug truncate">
                                {art.title}
                            </h2>
                            <p className={`text-xs mt-0.5 capitalize ${statusColor}`}>
                                {art.status}
                            </p>
                            {art.boosted_until && (
                                <p className="mt-1 text-[11px] text-amber-500">
                                    Boosted until {new Date(art.boosted_until).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        <ArtActions
                            art={art}
                            onView={onView}
                            onEdit={onEdit}
                            onBoost={onBoost}
                            onTrash={onTrash}
                        />
                    </div>

                    {art.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                            {art.description}
                        </p>
                    )}

                    {labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {labels.map((label) => (
                                <span
                                    key={label}
                                    className="border rounded-md px-2 py-0.5 text-xs text-muted-foreground"
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-4">
                        <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {art.views.toLocaleString()} views
                        </span>
                        <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                            {art.likes.toLocaleString()} likes
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {art.comments_count.toLocaleString()} comments
                        </span>
                        <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {art.super_likes_count.toLocaleString()} super likes
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function BulkSelectionBar({
    selectedCount,
    totalCount,
    onSelectAll,
    onClear,
    onDelete,
    disabled,
}: {
    selectedCount: number
    totalCount: number
    onSelectAll: () => void
    onClear: () => void
    onDelete: () => void
    disabled?: boolean
}) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
            <span className="text-muted-foreground">{selectedCount} selected</span>
            <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onSelectAll}
                disabled={disabled || selectedCount === totalCount}
            >
                Select all
            </Button>
            <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClear}
                disabled={disabled || selectedCount === 0}
            >
                Unselect
            </Button>
            <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={onDelete}
                disabled={disabled || selectedCount === 0}
            >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete selected
            </Button>
        </div>
    )
}

function ArtImageCarousel({ art }: { art: Art }) {
    const images = getArtImages(art)

    if (images.length === 0) {
        return (
            <div className="w-full lg:w-72 aspect-square rounded-lg bg-muted flex items-center justify-center">
                <ImageOff className="h-6 w-6 text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="w-full lg:w-72">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
                {images.map((image, index) => (
                    <div
                        key={`${image.image_path}-${index}`}
                        className="w-full min-w-full snap-center rounded-lg border bg-background overflow-hidden"
                    >
                        <div className="aspect-square bg-muted">
                            <img
                                src={storageUrl(image.image_path)!}
                                alt={`${art.title} image ${index + 1}`}
                                className="h-full w-full object-contain"
                            />
                        </div>
                        {image.description && (
                            <p className="text-xs text-muted-foreground p-2 border-t line-clamp-2">
                                {image.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>
            {images.length > 1 && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ChevronLeft className="h-3 w-3" />
                    <span>{images.length} images</span>
                    <ChevronRight className="h-3 w-3" />
                </div>
            )}
        </div>
    )
}

function ExistingImagesPreview({ art }: { art: Art }) {
    const images = getArtImages(art)

    return (
        <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
                <div
                    key={`${image.image_path}-${index}`}
                    className="w-40 shrink-0 border rounded-lg overflow-hidden bg-background"
                >
                    <div className="aspect-square bg-muted">
                        <img
                            src={storageUrl(image.image_path)!}
                            alt={`${art.title} current image ${index + 1}`}
                            className="h-full w-full object-contain"
                        />
                    </div>
                    {image.description && (
                        <p className="text-xs text-muted-foreground p-2 border-t line-clamp-2">
                            {image.description}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}

function ArtViewDialog({
    art,
    open,
    onOpenChange,
}: {
    art: Art | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    if (!art) return null

    const images = getArtImages(art)
    const labels = art.labels ?? []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[92dvh] w-[min(96vw,1180px)] max-w-none overflow-hidden p-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>{art.title}</DialogTitle>
                    <DialogDescription>Art post preview</DialogDescription>
                </DialogHeader>
                <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="min-h-0 overflow-y-auto bg-zinc-950 p-4">
                        {images.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-white/60">
                                <ImageOff className="h-8 w-8" />
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {images.map((image, index) => (
                                    <figure
                                        key={`${image.image_path}-${index}`}
                                        className="rounded-lg bg-black/30 p-2"
                                    >
                                        <img
                                            src={storageUrl(image.image_path)!}
                                            alt={`${art.title} image ${index + 1}`}
                                            draggable={false}
                                            onContextMenu={(event) => event.preventDefault()}
                                            className="mx-auto max-h-[78dvh] w-auto max-w-full select-none object-contain"
                                        />
                                        {image.description && (
                                            <figcaption className="mt-2 text-sm text-white/70">
                                                {image.description}
                                            </figcaption>
                                        )}
                                    </figure>
                                ))}
                            </div>
                        )}
                    </div>
                    <aside className="min-h-0 overflow-y-auto border-l bg-background p-5">
                        <h2 className="text-xl font-semibold">{art.title}</h2>
                        <p className={`mt-1 text-xs capitalize ${STATUS_COLOR[art.status]}`}>
                            {art.status}
                        </p>
                        {art.description ? (
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                {art.description}
                            </p>
                        ) : (
                            <p className="mt-4 text-sm text-muted-foreground">
                                No description added.
                            </p>
                        )}
                        {labels.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {labels.map((label) => (
                                    <span
                                        key={label}
                                        className="rounded-md border px-2 py-1 text-xs text-muted-foreground"
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                            <Metric label="Views" value={art.views} />
                            <Metric label="Likes" value={art.likes} />
                            <Metric label="Comments" value={art.comments_count} />
                            <Metric label="Super Likes" value={art.super_likes_count} />
                        </div>
                        <div className="mt-6">
                            <CommentSection
                                targetType="art"
                                targetId={art.id}
                                title="Art comments"
                                compact
                            />
                        </div>
                    </aside>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-lg font-semibold">{value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
        </div>
    )
}

function EmptyState({
    icon: Icon,
    title,
    actionLabel,
    onAction,
}: {
    icon: LucideIcon
    title: string
    actionLabel?: string
    onAction?: () => void
}) {
    return (
        <div className="py-16 text-center">
            <Icon className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground text-sm mb-4">{title}</p>
            {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
        </div>
    )
}

function LabelBadgeInput({
    labels,
    input,
    onInputChange,
    onChange,
}: {
    labels: string[]
    input: string
    onInputChange: (value: string) => void
    onChange: (labels: string[]) => void
}) {
    const suggestions = useQuery({
        queryKey: ['art-tags', input],
        queryFn: () => publicApi.getArtTags(input).then((res) => res.data),
        staleTime: 60 * 1000,
    })

    const addLabel = (raw: string) => {
        const label = raw.trim().toLowerCase()
        if (!label || labels.includes(label) || labels.length >= 12) return
        onChange([...labels, label])
        onInputChange('')
    }

    const removeLabel = (label: string) => {
        onChange(labels.filter((item) => item !== label))
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter' && event.key !== ',') return
        event.preventDefault()
        addLabel(input)
    }

    const filteredSuggestions = (suggestions.data ?? []).filter(
        (tag: { label: string }) => !labels.includes(tag.label.toLowerCase())
    )

    return (
        <div className="grid gap-2">
            <div className="min-h-10 rounded-md border bg-background px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    {labels.map((label) => (
                        <span
                            key={label}
                            className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-xs"
                        >
                            {label}
                            <button
                                type="button"
                                onClick={() => removeLabel(label)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <input
                        id="art-labels"
                        value={input}
                        placeholder={labels.length === 0 ? 'Type a label and press Enter' : ''}
                        onChange={(event) => onInputChange(event.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-w-40 flex-1 bg-transparent text-sm outline-none"
                    />
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Add up to 12 labels. Press Enter or comma after each label.
            </p>

            {filteredSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {filteredSuggestions
                        .slice(0, 8)
                        .map((tag: { label: string; artists_count: number }) => (
                            <button
                                key={tag.label}
                                type="button"
                                onClick={() => addLabel(tag.label)}
                                className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                {tag.label} · {tag.artists_count} artists
                            </button>
                        ))}
                </div>
            )}
        </div>
    )
}

function ArtActions({
    art,
    onView,
    onEdit,
    onBoost,
    onTrash,
}: {
    art: Art
    onView: (art: Art) => void
    onEdit: (art: Art) => void
    onBoost: (art: Art) => void
    onTrash: (art: Art) => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(art)}>
                    <Eye size={14} className="mr-2" />
                    View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(art)}>
                    <Pencil size={14} className="mr-2" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBoost(art)}>
                    <Sparkles size={14} className="mr-2" />
                    Boost
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => onTrash(art)}
                    className="text-red-500 focus:text-red-500"
                >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function AnalyticsTable({ arts }: { arts: Art[] }) {
    if (arts.length === 0) {
        return <EmptyState icon={BarChart3} title="No analytics yet" />
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Art Post</TableHead>
                    <TableHead className="hidden sm:table-cell">Pictures</TableHead>
                    <TableHead className="hidden sm:table-cell">Views</TableHead>
                    <TableHead className="hidden sm:table-cell">Likes</TableHead>
                    <TableHead className="hidden sm:table-cell">Comments</TableHead>
                    <TableHead className="hidden sm:table-cell">Super Likes</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {arts.map((art) => (
                    <TableRow key={art.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <img
                                    src={storageUrl(getFirstImagePath(art))!}
                                    alt={art.title}
                                    className="h-10 w-10 rounded-md object-cover bg-muted"
                                />
                                <span className="font-medium text-sm">{art.title}</span>
                            </div>
                            <p className="sm:hidden text-xs text-muted-foreground mt-1">
                                {art.views.toLocaleString()} views - {art.likes.toLocaleString()}{' '}
                                likes
                            </p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {getArtImages(art).length.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {art.views.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {art.likes.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {art.comments_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {art.super_likes_count.toLocaleString()}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

void [ArtPostRow, BulkSelectionBar, AnalyticsTable]

function TrashTable({
    arts,
    daysLeft,
    onRestore,
    onForceDelete,
}: {
    arts: Art[]
    daysLeft: (deletedAt?: string | null) => number
    onRestore: (art: Art) => void
    onForceDelete: (art: Art) => void
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Art Post</TableHead>
                    <TableHead className="hidden sm:table-cell">Days Left</TableHead>
                    <TableHead className="w-28" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {arts.map((art) => (
                    <TableRow key={art.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <img
                                    src={storageUrl(getFirstImagePath(art))!}
                                    alt={art.title}
                                    className="h-10 w-10 rounded-md object-cover bg-muted grayscale opacity-70"
                                />
                                <div>
                                    <p className="font-medium text-sm">{art.title}</p>
                                    <p className="sm:hidden text-xs text-muted-foreground">
                                        {daysLeft(art.deleted_at)} days left
                                    </p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {daysLeft(art.deleted_at)}
                        </TableCell>
                        <TableCell>
                            <div className="flex justify-end gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => onRestore(art)}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => onForceDelete(art)}
                                    className="text-red-500 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function getArtImages(art: Art) {
    if (art.images?.length > 0) return art.images

    return [
        {
            id: art.id,
            art_id: art.id,
            image_path: art.image_path,
            description: art.description,
            sort_order: 0,
            created_at: art.created_at,
            updated_at: art.updated_at,
        },
    ]
}

function getFirstImagePath(art: Art) {
    return getArtImages(art)[0]?.image_path ?? art.image_path
}

function confirmTitle(confirm: ConfirmState) {
    if (confirm?.type === 'restore') return 'Restore this art post?'
    if (confirm?.type === 'force') return 'Permanently delete this art post?'
    return 'Move this art post to trash?'
}

function confirmDescription(confirm: ConfirmState) {
    if (confirm?.type === 'restore') {
        return `"${confirm.art.title}" will return to your My Arts dashboard.`
    }
    if (confirm?.type === 'force') {
        return `"${confirm.art.title}" will be permanently deleted and cannot be recovered.`
    }
    if (confirm?.type === 'trash') {
        return `"${confirm.art.title}" will stay recoverable for 30 days.`
    }
    return 'Please confirm this action.'
}
