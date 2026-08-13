import { type ReactNode } from 'react'
import {
    BarChart3,
    Eye,
    Heart,
    ImageOff,
    MessageCircle,
    Pencil,
    Sparkles,
    Trash2,
} from 'lucide-react'
import CommentSection from '@/features/comments/components/CommentSection'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { Art } from '@/types/art'
import { ART_STATUS_COLOR } from '@/features/arts/constants/myArts'
import { getArtImages, getFirstImagePath } from '@/features/arts/utils/myArts'
import { ArtImageCarousel } from '@/features/arts/components/ArtImagePresentation'
import {
    AnalyticsTable,
    ArtActions,
    ArtMetric as Metric,
} from '@/features/arts/components/MyArtsPresentation'
import ViewProfileLink from '@/components/profile/ViewProfileLink'
import { storageUrl } from '@/utils/storage'

// My Arts views ----
export function ArtDashboardCard({
    art,
    selected,
    selectionMode = false,
    onSelect,
    onView,
    onEdit,
    onBoost,
    onTrash,
}: {
    art: Art
    selected: boolean
    selectionMode?: boolean
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
                selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-border'
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
                            <ImageOff className="h-8 w-8 text-muted-foreground" />
                        </span>
                    )}
                </button>

                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-background/90 px-2 py-1 text-[9px] font-bold capitalize text-foreground shadow-sm backdrop-blur">
                        {art.status}
                    </span>
                    {art.boosted_until ? (
                        <span className="rounded-full bg-rose-400 px-2 py-1 text-[9px] font-bold text-white shadow-sm">
                            Boosted
                        </span>
                    ) : null}
                </div>

                <label
                    className={`absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-opacity ${
                        selectionMode || selected
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                    }`}
                >
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
                        <ViewProfileLink
                            username={art.user?.username}
                            role={art.user?.role}
                            compact
                            className="mt-1"
                        />
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

export function StudioPanel({
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

export function ArtPostRow({
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
    const statusColor = ART_STATUS_COLOR[art.status] ?? 'text-gray-400'

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
                            <ViewProfileLink
                                username={art.user?.username}
                                role={art.user?.role}
                                compact
                                className="mt-1"
                            />
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

export function BulkSelectionBar({
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

export function ArtViewDialog({
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
                        <p className={`mt-1 text-xs capitalize ${ART_STATUS_COLOR[art.status]}`}>
                            {art.status}
                        </p>

                        {art.user && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                        {art.user.name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        @{art.user.username}
                                    </p>
                                </div>
                                <ViewProfileLink
                                    username={art.user.username}
                                    role={art.user.role}
                                    label="View Profile"
                                />
                            </div>
                        )}

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
                                artistUsername={
                                    art.user?.role === 'storyteller'
                                        ? art.user.username
                                        : undefined
                                }
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

void [ArtPostRow, BulkSelectionBar, AnalyticsTable]
