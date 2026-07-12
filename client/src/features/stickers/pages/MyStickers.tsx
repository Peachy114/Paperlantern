import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Images, Layers, Plus, Receipt, Trash2, Users, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMyStickers } from '@/features/stickers/hooks/useMyStickers'
import type { ArtistSticker } from '@/types/artistProfile'
import { storageUrl } from '@/utils/storage'

type StickerFilter = 'all' | 'created' | 'subscribed' | 'bought'

export default function MyStickers() {
    const { data, isLoading, createSticker, deleteSticker } = useMyStickers()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [image, setImage] = useState<File | null>(null)
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

        if (!name.trim()) {
            toast.error('Sticker name is required.')
            return
        }

        if (!image) {
            toast.error('Choose a sticker image.')
            return
        }

        const payload = new FormData()
        payload.append('name', name.trim())
        payload.append('image', image)

        try {
            await createSticker.mutateAsync(payload)
            setName('')
            setImage(null)
            setFileKey((current) => current + 1)
            setOpen(false)
            toast.success('Sticker added.')
        } catch {
            toast.error('Could not add sticker.')
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
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4" />
                            Add Sticker
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Sticker</DialogTitle>
                            <DialogDescription>
                                Upload a PNG, WebP, or animated GIF for your sticker library.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submit} className="grid gap-4">
                            <div className="grid gap-1">
                                <Label htmlFor="sticker-name">Name</Label>
                                <Input
                                    id="sticker-name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="sticker-upload">Sticker</Label>
                                <Input
                                    key={fileKey}
                                    id="sticker-upload"
                                    type="file"
                                    accept="image/png,image/webp,image/gif"
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        setImage(event.target.files?.[0] ?? null)
                                    }
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={busy}>
                                    <Plus className="h-4 w-4" />
                                    Add
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
