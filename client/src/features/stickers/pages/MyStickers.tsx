import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Images, Layers, Plus, Receipt, Trash2, Users, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMyStickers } from '@/features/stickers/hooks/useMyStickers'
import type { ArtistSticker } from '@/types/artistProfile'
import { storageUrl } from '@/utils/storage'

type StickerFilter = 'all' | 'created' | 'subscribed' | 'bought'
type StickerUpload = { file: File; name: string; previewUrl: string }

export default function MyStickers() {
    const { data, isLoading, createSticker, deleteSticker } = useMyStickers()
    const [open, setOpen] = useState(false)
    const [isBundle, setIsBundle] = useState(false)
    const [bundleName, setBundleName] = useState('')
    const [isFree, setIsFree] = useState(false)
    const [creditCost, setCreditCost] = useState(1)
    const [publishPublic, setPublishPublic] = useState(false)
    const [subscriptionFree, setSubscriptionFree] = useState(false)
    const [uploads, setUploads] = useState<StickerUpload[]>([])
    const [fileKey, setFileKey] = useState(0)

    const stickersByFilter = useMemo(() => {
        const owned = data?.owned ?? []
        const subscribed = data?.subscribed ?? []
        const bought = data?.bought ?? []

        return {
            all: [...owned, ...subscribed, ...bought],
            created: owned,
            subscribed,
            bought,
        } satisfies Record<StickerFilter, ArtistSticker[]>
    }, [data])

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (uploads.length === 0) {
            toast.error('Choose at least one sticker image.')
            return
        }

        if (isBundle && !bundleName.trim()) {
            toast.error('Bundle name is required when creating a bundle.')
            return
        }

        if (!isFree && creditCost < 1) {
            toast.error(isBundle ? 'Bundle credit cost is required.' : 'Credit cost is required.')
            return
        }

        const payload = new FormData()
        payload.append('name', uploads[0]?.name.trim() || stickerNameFromFile(uploads[0].file))
        payload.append('bundle_name', isBundle ? bundleName.trim() : '')
        payload.append('is_free', isFree ? '1' : '0')
        payload.append('credit_cost', String(isFree ? 0 : Math.max(1, creditCost)))
        payload.append('publish_public', publishPublic ? '1' : '0')
        payload.append('subscription_free', subscriptionFree ? '1' : '0')
        uploads.forEach((upload) => {
            payload.append('images[]', upload.file)
            payload.append('sticker_names[]', upload.name.trim())
        })

        try {
            await createSticker.mutateAsync(payload)
            setIsBundle(false)
            setBundleName('')
            setIsFree(false)
            setCreditCost(1)
            setPublishPublic(false)
            setSubscriptionFree(false)
            uploads.forEach((upload) => URL.revokeObjectURL(upload.previewUrl))
            setUploads([])
            setFileKey((current) => current + 1)
            setOpen(false)
            toast.success(uploads.length === 1 ? 'Sticker added.' : 'Sticker bundle added.')
        } catch {
            toast.error(publishPublic ? 'Could not add and publish sticker. Check your credits.' : 'Could not add sticker.')
        }
    }

    const removeSticker = async (sticker: ArtistSticker) => {
        try {
            await deleteSticker.mutateAsync(sticker.id)
            toast.success('Sticker deleted.')
        } catch {
            toast.error('Could not delete sticker.')
        }
    }

    const removeUpload = (index: number) => {
        setUploads((current) => {
            current[index] && URL.revokeObjectURL(current[index].previewUrl)
            return current.filter((_, itemIndex) => itemIndex !== index)
        })
        setFileKey((current) => current + 1)
    }

    const busy = createSticker.isPending || deleteSticker.isPending

    return (
        <main className="mx-auto max-w-[1360px] px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Stickers</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your sticker library and board-ready sticker assets.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Sticker</DialogTitle>
                            <DialogDescription>
                                Upload solo stickers or create a bundle. Names are optional and default to the file name.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submit} className="grid gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={isBundle}
                                    onChange={(event) => setIsBundle(event.target.checked)}
                                />
                                Create as bundle
                            </label>
                            <div className="grid gap-1">
                                <Label htmlFor="sticker-bundle">
                                    Bundle name{isBundle ? '' : ', optional'}
                                </Label>
                                <Input
                                    id="sticker-bundle"
                                    value={bundleName}
                                    disabled={!isBundle}
                                    onChange={(event) => setBundleName(event.target.value)}
                                    placeholder={isBundle ? 'Bundle name' : 'Solo stickers do not need a bundle'}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="sticker-visibility">Visibility</Label>
                                <select
                                    id="sticker-visibility"
                                    value={publishPublic ? 'public' : 'private'}
                                    onChange={(event) => {
                                        const isPublic = event.target.value === 'public'
                                        setPublishPublic(isPublic)
                                        if (!isPublic) {
                                            setSubscriptionFree(false)
                                        }
                                    }}
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="private">Private</option>
                                    <option value="public">Public</option>
                                </select>
                                {publishPublic && (
                                    <p className="text-xs text-muted-foreground">
                                        Public publishing is free with an active subscription, otherwise it costs 20 credits.
                                    </p>
                                )}
                            </div>
                            {publishPublic && (
                                <>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={isFree}
                                            onChange={(event) => {
                                                setIsFree(event.target.checked)
                                                if (event.target.checked) setCreditCost(0)
                                                else setCreditCost((current) => Math.max(1, current || 1))
                                            }}
                                        />
                                        Free sticker
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={subscriptionFree}
                                            onChange={(event) => setSubscriptionFree(event.target.checked)}
                                        />
                                        Free for active subscriptions
                                    </label>
                                    <div className="grid gap-1">
                                        <Label htmlFor="sticker-credit-cost">
                                            {isBundle ? 'Bundle credit cost' : 'Credit cost per sticker'}
                                        </Label>
                                        <Input
                                            id="sticker-credit-cost"
                                            type="number"
                                            min={0}
                                            max={1000}
                                            value={creditCost}
                                            disabled={isFree}
                                            onChange={(event) => setCreditCost(Number(event.target.value) || 0)}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="grid gap-1">
                                <Label htmlFor="sticker-upload">Sticker images</Label>
                                <Input
                                    key={fileKey}
                                    id="sticker-upload"
                                    type="file"
                                    accept="image/png,image/webp,image/gif"
                                    multiple
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        setUploads((current) => {
                                            current.forEach((upload) => URL.revokeObjectURL(upload.previewUrl))
                                            return Array.from(event.target.files ?? []).map((file) => ({
                                                file,
                                                name: stickerNameFromFile(file),
                                                previewUrl: URL.createObjectURL(file),
                                            }))
                                        })
                                    }
                                />
                                {uploads.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {uploads.length} file{uploads.length === 1 ? '' : 's'} selected
                                    </p>
                                )}
                            </div>
                            {uploads.length > 0 && (
                                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                                    {uploads.map((upload, index) => (
                                        <div
                                            key={`${upload.file.name}-${index}`}
                                            className="grid grid-cols-[64px_1fr_auto] items-end gap-3 rounded-md bg-muted/30 p-2"
                                        >
                                            <div className="h-16 w-16 overflow-hidden rounded-md border bg-[linear-gradient(45deg,var(--muted)_25%,transparent_25%),linear-gradient(-45deg,var(--muted)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--muted)_75%),linear-gradient(-45deg,transparent_75%,var(--muted)_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0] p-1">
                                                <img
                                                    src={upload.previewUrl}
                                                    alt=""
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label htmlFor={`sticker-upload-name-${index}`}>
                                                    Sticker {index + 1} name, optional
                                                </Label>
                                                <Input
                                                    id={`sticker-upload-name-${index}`}
                                                    value={upload.name}
                                                    onChange={(event) =>
                                                        setUploads((current) =>
                                                            current.map((item, itemIndex) =>
                                                                itemIndex === index
                                                                    ? { ...item, name: event.target.value }
                                                                    : item
                                                            )
                                                        )
                                                    }
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => removeUpload(index)}
                                                aria-label={`Remove sticker ${index + 1}`}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <DialogFooter>
                                <Button type="submit" disabled={busy}>
                                    <Plus className="h-4 w-4" />
                                    {publishPublic ? 'Add and Publish' : 'Add'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StickerStat icon={Layers} label="Total Stickers" value={data?.stats.total ?? 0} />
                <StickerStat icon={Users} label="Subscribed" value={data?.stats.subscribed ?? 0} />
                <StickerStat icon={Receipt} label="Bought" value={data?.stats.bought ?? 0} />
            </div>

            <Tabs defaultValue="all">
                <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="created">Created</TabsTrigger>
                    <TabsTrigger value="subscribed">Subscribed</TabsTrigger>
                    <TabsTrigger value="bought">Bought</TabsTrigger>
                </TabsList>

                {(['all', 'created', 'subscribed', 'bought'] as StickerFilter[]).map((filter) => (
                    <TabsContent key={filter} value={filter}>
                        {isLoading ? (
                            <StickerShelfSkeleton />
                        ) : (
                            <StickerShelf
                                stickers={stickersByFilter[filter]}
                                busy={busy}
                                canDelete={filter === 'all' || filter === 'created'}
                                onDelete={removeSticker}
                            />
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </main>
    )
}

function stickerNameFromFile(file: File) {
    return file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()
}

function StickerStat({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon
    label: string
    value: number
}) {
    return (
        <div className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    )
}

function StickerShelf({
    stickers,
    busy,
    canDelete,
    onDelete,
}: {
    stickers: ArtistSticker[]
    busy: boolean
    canDelete: boolean
    onDelete: (sticker: ArtistSticker) => void
}) {
    if (stickers.length === 0) {
        return (
            <div className="rounded-lg border py-16 text-center">
                <Images className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No stickers here yet</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {stickers.map((sticker) => {
                const created = sticker.library_status === 'created'

                return (
                    <div
                        key={`${sticker.library_status ?? 'created'}-${sticker.id}`}
                            className="group rounded-lg border bg-background p-2 transition-colors hover:bg-muted/30"
                    >
                        <div className="relative h-[150px] overflow-hidden rounded-md border bg-[linear-gradient(45deg,var(--muted)_25%,transparent_25%),linear-gradient(-45deg,var(--muted)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--muted)_75%),linear-gradient(-45deg,transparent_75%,var(--muted)_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] p-3">
                            <img
                                src={storageUrl(sticker.image_path)!}
                                alt={sticker.name}
                                className="h-full w-full object-contain transition-transform group-hover:scale-105"
                            />
                            {canDelete && created && (
                                <Button
                                    variant="secondary"
                                    size="icon-sm"
                                    disabled={busy}
                                    onClick={() => onDelete(sticker)}
                                    className="absolute right-1 top-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                        <div className="mt-2 min-w-0">
                            <p className="truncate text-xs font-medium">{sticker.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                                {sticker.owner?.username ? `@${sticker.owner.username}` : 'Created'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {sticker.bundle_name && (
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                        {sticker.bundle_name}
                                    </span>
                                )}
                                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                                    {sticker.is_free ? 'Free' : `${sticker.credit_cost ?? sticker.purchase_cost ?? 1} credits`}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function StickerShelfSkeleton() {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {Array.from({ length: 20 }).map((_, index) => (
                <div key={index} className="rounded-lg border bg-background p-2">
                    <Skeleton className="h-[150px] rounded-md" />
                    <Skeleton className="mt-2 h-3 w-3/4" />
                    <Skeleton className="mt-1 h-3 w-1/2" />
                </div>
            ))}
        </div>
    )
}
