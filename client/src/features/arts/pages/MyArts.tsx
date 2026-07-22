import {
    useMemo,
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
import { useMyArts } from '@/features/arts/hooks/useMyArts'
import BoostModal from '@/features/boosts/components/BoostModal'
import CommentSection from '@/features/comments/components/CommentSection'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

const periods = ['Daily', 'Weekly', 'Monthly'] as const

export default function MyArts() {
    const queryClient = useQueryClient()
    const {
        arts,
        stats,
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
    const [period, setPeriod] = useState<(typeof periods)[number]>('Weekly')
    const [selectedArts, setSelectedArts] = useState<string[]>([])

    const artistCreditShare = Math.floor(stats.super_like_credits * 0.8)
    const platformCreditShare = stats.super_like_credits - artistCreditShare

    const statCards = useMemo(
        () => [
            { label: 'Posts', value: stats.arts.toLocaleString(), icon: Images },
            { label: 'Views', value: stats.views.toLocaleString(), icon: BarChart3 },
            { label: 'Likes', value: stats.likes.toLocaleString(), icon: Heart },
            { label: 'Super Likes', value: stats.super_likes.toLocaleString(), icon: Sparkles },
        ],
        [stats]
    )

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
                await updateArt.mutateAsync({ slug: editing.slug, payload: buildPayload() })
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
            toast.success(`${selected.length} art post${selected.length === 1 ? '' : 's'} moved to trash.`)
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
        <div className="p-5 lg:dark:bg-white/4 lg:bg-muted/30 lg:border border-b-zinc-900 rounded-3xl">
            <News audience="studio" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Arts</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your art posts
                    </p>
                </div>

                <Button onClick={openCreate}>
                    <PlusCircle className="h-4 w-4" />
                    Add Post
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-2xl font-bold">{value}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                            </div>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="arts">
                <TabsList className="mb-4 flex h-auto flex-wrap">
                    <TabsTrigger value="arts">Arts</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="earnings">Earnings</TabsTrigger>
                    <TabsTrigger value="trash">Trash</TabsTrigger>
                </TabsList>

                <TabsContent value="arts">
                    <StudioPanel
                        title="Art Posts"
                        count={arts.length}
                        action={
                            arts.length > 0 ? (
                                <BulkSelectionBar
                                    selectedCount={selectedArts.length}
                                    totalCount={arts.length}
                                    onSelectAll={() => setSelectedArts(arts.map((art) => art.id))}
                                    onClear={clearSelectedArts}
                                    onDelete={trashSelectedArts}
                                    disabled={acting}
                                />
                            ) : undefined
                        }
                    >
                        {arts.length === 0 ? (
                            <EmptyState
                                icon={Images}
                                title="No art posts yet"
                                actionLabel="Add art post"
                                onAction={openCreate}
                            />
                        ) : (
                            <div className="divide-y">
                                {arts.map((art) => (
                                    <ArtPostRow
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
                    </StudioPanel>
                </TabsContent>

                <TabsContent value="analytics">
                    <StudioPanel
                        title={`${period} Picture Views`}
                        action={
                            <div className="flex rounded-md border overflow-hidden">
                                {periods.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setPeriod(item)}
                                        className={`px-3 py-1 text-xs ${
                                            period === item
                                                ? 'bg-foreground text-background'
                                                : 'hover:bg-accent'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        <AnalyticsTable arts={arts} />
                    </StudioPanel>
                </TabsContent>

                <TabsContent value="comments">
                    <StudioPanel title="Comments" count={stats.comments}>
                        <div className="px-4 py-3 border-b bg-muted/20 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="border rounded-md px-2 py-1">All art posts</span>
                            <span className="border rounded-md px-2 py-1">All languages</span>
                            <span className="border rounded-md px-2 py-1">Manage blocked users</span>
                        </div>
                        <EmptyState icon={MessageCircle} title="No art comments yet" />
                    </StudioPanel>
                </TabsContent>

                <TabsContent value="earnings">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="border rounded-lg p-4">
                            <div className="text-xs text-muted-foreground">Super Like Credits</div>
                            <div className="text-2xl font-bold mt-1">
                                {stats.super_like_credits.toLocaleString()}
                            </div>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="text-xs text-muted-foreground">Artist Share</div>
                            <div className="text-2xl font-bold mt-1">
                                {artistCreditShare.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">80%</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="text-xs text-muted-foreground">Website Share</div>
                            <div className="text-2xl font-bold mt-1">
                                {platformCreditShare.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">20%</p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="trash">
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
                </TabsContent>
            </Tabs>

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
                        <AlertDialogDescription>{confirmDescription(confirm)}</AlertDialogDescription>
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
        </div>
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
                                    Boosted until{' '}
                                    {new Date(art.boosted_until).toLocaleDateString()}
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
            <span className="text-muted-foreground">
                {selectedCount} selected
            </span>
            <Button type="button" size="sm" variant="outline" onClick={onSelectAll} disabled={disabled || selectedCount === totalCount}>
                Select all
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClear} disabled={disabled || selectedCount === 0}>
                Unselect
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={onDelete} disabled={disabled || selectedCount === 0}>
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
                                    <figure key={`${image.image_path}-${index}`} className="rounded-lg bg-black/30 p-2">
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
                            <p className="mt-4 text-sm text-muted-foreground">No description added.</p>
                        )}
                        {labels.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {labels.map((label) => (
                                    <span key={label} className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
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
                            <CommentSection targetType="art" targetId={art.id} title="Art comments" compact />
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
                    {filteredSuggestions.slice(0, 8).map(
                        (tag: { label: string; artists_count: number }) => (
                            <button
                                key={tag.label}
                                type="button"
                                onClick={() => addLabel(tag.label)}
                                className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                {tag.label} · {tag.artists_count} artists
                            </button>
                        )
                    )}
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
