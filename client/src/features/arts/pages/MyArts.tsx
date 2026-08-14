import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, Heart, Images, Info, MessageCircle, PlusCircle, Sparkles, Trash2 } from 'lucide-react'
import News from '@/features/announcements/components/News'
import WorkspaceBannerPicker from '@/features/announcements/components/WorkspaceBannerPicker'
import { useMyArts } from '@/features/arts/hooks/useMyArts'
import BoostModal from '@/features/boosts/components/BoostModal'
import CreatorWorkspaceShell from '@/features/studio/components/workspace/CreatorWorkspaceShell'
import { storageUrl } from '@/utils/storage'
import type { Art, ArtStatus } from '@/types/art'
import type { ArtConfirmation, MyArtsFormState } from '@/features/arts/types/myArts'
import { EMPTY_ART_FORM } from '@/features/arts/constants/myArts'
import {
    artConfirmationDescription,
    artConfirmationTitle,
    getFirstImagePath,
} from '@/features/arts/utils/myArts'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArtsActivityChart } from '@/features/arts/components/ArtsActivityChart'
import { ExistingImagesPreview } from '@/features/arts/components/ArtImagePresentation'
import {
    ArtsEmptyState as EmptyState,
    TrashTable,
} from '@/features/arts/components/MyArtsPresentation'
import { ArtLabelInput as LabelBadgeInput } from '@/features/arts/components/ArtLabelInput'
import {
    ArtDashboardCard,
    ArtViewDialog,
    StudioPanel,
} from '@/features/arts/components/MyArtsViews'

const MAX_ART_IMAGES = 10
const MAX_ART_IMAGE_SIZE_MB = 15
const MAX_ART_IMAGE_SIZE_BYTES = MAX_ART_IMAGE_SIZE_MB * 1024 * 1024

const ALLOWED_ART_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

type ValidationErrorLike = {
    response?: {
        data?: {
            message?: string
            errors?: Record<string, string[]>
        }
    }
}

function fileSizeInMb(bytes: number) {
    return (bytes / (1024 * 1024)).toFixed(1)
}

function getServerImageErrors(error: unknown): string[] {
    const validationError = error as ValidationErrorLike
    const errors = validationError.response?.data?.errors

    if (!errors) return []

    return Object.entries(errors)
        .filter(([field]) => field === 'image' || field === 'images' || field.startsWith('images.'))
        .flatMap(([, messages]) => messages)
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
    const [form, setForm] = useState<MyArtsFormState>(EMPTY_ART_FORM)
    const [confirm, setConfirm] = useState<ArtConfirmation>(null)
    const [boostArt, setBoostArt] = useState<Art | null>(null)
    const [viewArt, setViewArt] = useState<Art | null>(null)
    const [selectedArts, setSelectedArts] = useState<string[]>([])
    const [selectionMode, setSelectionMode] = useState(false)
    const [activeSection, setActiveSection] = useState('arts')
    const [workspaceBannerImage, setWorkspaceBannerImage] = useState<string | null>(null)
    const [imageErrors, setImageErrors] = useState<string[]>([])

    const featuredArt = arts.find((art) => getFirstImagePath(art)) ?? arts[0] ?? null
    const featuredImage = featuredArt ? storageUrl(getFirstImagePath(featuredArt)) : null
    const activeBannerImage = workspaceBannerImage ?? featuredImage

    const statCards = [
        { label: 'Arts', value: stats.arts, icon: Images, color: 'text-muted-foreground' },
        { label: 'Views', value: stats.views, icon: Eye, color: 'text-muted-foreground' },
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

    const clearImagePreviews = () => {
        form.images.forEach((image) => URL.revokeObjectURL(image.preview))
    }

    const openCreate = () => {
        clearImagePreviews()
        setEditing(null)
        setForm(EMPTY_ART_FORM)
        setImageErrors([])
        setFormOpen(true)
    }

    const openEdit = (art: Art) => {
        clearImagePreviews()
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
        setImageErrors([])
        setFormOpen(true)
    }

    const handleFormOpenChange = (open: boolean) => {
        if (!open) {
            clearImagePreviews()
            setImageErrors([])
        }

        setFormOpen(open)
    }

    const handleImages = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files ?? [])
        const nextErrors: string[] = []

        if (selectedFiles.length > MAX_ART_IMAGES) {
            nextErrors.push(
                `You selected ${selectedFiles.length} images. Maximum is ${MAX_ART_IMAGES}; only the first ${MAX_ART_IMAGES} were checked.`
            )
        }

        const files = selectedFiles.slice(0, MAX_ART_IMAGES)
        const validFiles = files.filter((file) => {
            if (!ALLOWED_ART_IMAGE_TYPES.has(file.type)) {
                nextErrors.push(`${file.name}: unsupported file type. Use JPG, PNG, WEBP, or GIF.`)
                return false
            }

            if (file.size > MAX_ART_IMAGE_SIZE_BYTES) {
                nextErrors.push(
                    `${file.name}: ${fileSizeInMb(file.size)} MB is too large. Maximum is ${MAX_ART_IMAGE_SIZE_MB} MB per image.`
                )
                return false
            }

            return true
        })

        setImageErrors(nextErrors)

        if (validFiles.length > 0) {
            setForm((current) => {
                current.images.forEach((image) => URL.revokeObjectURL(image.preview))

                return {
                    ...current,
                    images: validFiles.map((file) => ({
                        file,
                        preview: URL.createObjectURL(file),
                        description: '',
                    })),
                }
            })
        } else if (files.length === 0) {
            setForm((current) => {
                current.images.forEach((image) => URL.revokeObjectURL(image.preview))
                return {
                    ...current,
                    images: [],
                }
            })
        }

        event.target.value = ''
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
            const message = 'Add at least one valid image before posting.'
            setImageErrors([message])
            toast.error(message)
            return
        }

        if (imageErrors.length > 0) {
            toast.error('Fix the image upload errors before posting.')
            return
        }

        setImageErrors([])

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
            clearImagePreviews()
            setFormOpen(false)
        } catch (error: unknown) {
            const serverImageErrors = getServerImageErrors(error)

            if (serverImageErrors.length > 0) {
                setImageErrors(serverImageErrors)
                toast.error(serverImageErrors[0])
                return
            }

            const validationError = error as ValidationErrorLike
            toast.error(validationError.response?.data?.message ?? 'Could not save art post.')
        }
    }

    const handleConfirm = async () => {
        if (!confirm) return

        try {
            if (confirm.type === 'trash') {
                await trashArt.mutateAsync(confirm.art.slug)
                toast.success('Art post moved to trash.')
            }
            if (confirm.type === 'bulk-trash') {
                const selected = arts.filter((art) => selectedArts.includes(art.id))
                for (const art of selected) {
                    await trashArt.mutateAsync(art.slug)
                }
                toast.success(
                    `${selected.length} art post${selected.length === 1 ? '' : 's'} moved to trash.`
                )
                clearSelectedArts()
                setSelectionMode(false)
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
                            className="inline-flex h-8 items-center rounded-full border border-sky-200 bg-card px-4 text-xs font-bold text-sky-600 shadow-sm transition hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10"
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
                            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                                <ArtsActivityChart points={viewsChart} />
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                                    {statCards.map(({ label, value, icon: Icon, color }) => (
                                        <div
                                            key={label}
                                            className="rounded-xl border border-border bg-card px-3 py-3 shadow-sm"
                                        >
                                            <div className={`flex items-center gap-1.5 ${color}`}>
                                                <Icon className="h-3.5 w-3.5" />
                                                <span className="text-[9px] font-bold">
                                                    {label}
                                                </span>
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
                                        onClick={() => {
                                            setSelectionMode(true)
                                            setSelectedArts(arts.map((art) => art.id))
                                        }}
                                        disabled={acting || selectedArts.length === arts.length}
                                        className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                    >
                                        Select all
                                    </button>
                                    {selectedArts.length > 0 ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    clearSelectedArts()
                                                    setSelectionMode(false)
                                                }}
                                                disabled={acting}
                                                className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                            >
                                                Clear
                                            </button>
                                            <span
                                                className="mx-1 h-4 w-px bg-border"
                                                aria-hidden="true"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirm({
                                                        type: 'bulk-trash',
                                                        count: selectedArts.length,
                                                    })
                                                }
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
                                        selectionMode={selectionMode}
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

            <Dialog open={formOpen} onOpenChange={handleFormOpenChange}>
                <DialogContent className="sm:max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Art Post' : 'Add Art Post'}</DialogTitle>
                            <DialogDescription>
                                Add labels, a description, and up to {MAX_ART_IMAGES} images.
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

                            <div
                                className={`grid gap-2 rounded-lg transition ${
                                    imageErrors.length > 0
                                        ? 'border border-destructive bg-destructive/5 p-3'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <Label
                                        htmlFor="art-images"
                                        className={
                                            imageErrors.length > 0 ? 'text-destructive' : undefined
                                        }
                                    >
                                        Images
                                    </Label>
                                    <span
                                        className={`text-xs ${
                                            imageErrors.length > 0
                                                ? 'font-semibold text-destructive'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        Max {MAX_ART_IMAGE_SIZE_MB} MB each
                                    </span>
                                </div>

                                {editing && form.images.length === 0 && (
                                    <ExistingImagesPreview art={editing} />
                                )}

                                {form.images.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {form.images.map((image, index) => (
                                            <div
                                                key={`${image.file.name}-${index}`}
                                                className="w-48 shrink-0 overflow-hidden rounded-lg border bg-background"
                                            >
                                                <div className="aspect-square bg-muted">
                                                    <img
                                                        src={image.preview}
                                                        alt={`Selected art ${index + 1}`}
                                                        className="h-full w-full object-contain"
                                                    />
                                                </div>
                                                <div className="border-t px-2 py-1 text-[10px] text-muted-foreground">
                                                    <p className="truncate font-medium text-foreground">
                                                        {image.file.name}
                                                    </p>
                                                    <p>{fileSizeInMb(image.file.size)} MB</p>
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
                                    aria-invalid={imageErrors.length > 0}
                                    aria-describedby={
                                        imageErrors.length > 0
                                            ? 'art-images-errors'
                                            : 'art-images-help'
                                    }
                                    className={
                                        imageErrors.length > 0
                                            ? 'border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20'
                                            : undefined
                                    }
                                    onChange={handleImages}
                                />

                                <p
                                    id="art-images-help"
                                    className={
                                        imageErrors.length > 0
                                            ? 'text-xs text-destructive'
                                            : 'text-xs text-muted-foreground'
                                    }
                                >
                                    JPG, PNG, WEBP or GIF. Up to {MAX_ART_IMAGES} images, maximum{' '}
                                    {MAX_ART_IMAGE_SIZE_MB} MB per image.
                                    {editing
                                        ? ' New uploads replace the current image set when editing.'
                                        : ''}
                                </p>

                                {imageErrors.length > 0 && (
                                    <div
                                        id="art-images-errors"
                                        role="alert"
                                        aria-live="polite"
                                        className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                                    >
                                        <p className="font-semibold">Fix the image upload:</p>
                                        <ul className="mt-1 list-disc space-y-1 pl-5">
                                            {imageErrors.map((error, index) => (
                                                <li key={`${error}-${index}`}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleFormOpenChange(false)}
                                disabled={acting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={acting || imageErrors.length > 0}>
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
                        <AlertDialogTitle>{artConfirmationTitle(confirm)}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {artConfirmationDescription(confirm)}
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
