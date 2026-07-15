import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Crown, Gift, Paintbrush, Plus, Sparkles, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { nobleRoyaltyApi } from '@/api/nobleRoyalty'
import { stickersApi } from '@/api/stickers'
import { useAuthStore } from '@/store/authStore'
import type { ArtistSticker, ProfileBorder, RoyaltyDesignAsset, RoyaltyDesignType } from '@/types/artistProfile'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'

type Tab = 'stickers' | 'borders' | RoyaltyDesignType
type StickerUpload = { file: File; name: string; previewUrl: string }

const TABS: Tab[] = ['stickers', 'borders', 'message_design', 'message_background', 'comment_border', 'board_button']
const TAB_LABELS: Record<Tab, string> = {
    stickers: 'Stickers',
    borders: 'Borders',
    message_design: 'Messages',
    message_background: 'Message Background',
    comment_border: 'Comment Border',
    board_button: 'Board Buttons',
}

export default function NobleRoyaltyBrowse() {
    const queryClient = useQueryClient()
    const user = useAuthStore((state) => state.user)
    const [tab, setTab] = useState<Tab>('stickers')
    const [stickerOpen, setStickerOpen] = useState(false)
    const [borderOpen, setBorderOpen] = useState(false)
    const [backgroundOpen, setBackgroundOpen] = useState(false)

    const royalty = useQuery({
        queryKey: ['noble-royalty'],
        queryFn: () => nobleRoyaltyApi.browse().then((res) => res.data),
    })

    const publishSticker = useMutation({
        mutationFn: (id: string) => nobleRoyaltyApi.publishSticker(id),
        onSuccess: (res) => {
            toast.success(res.data?.message ?? 'Sticker published.')
            queryClient.invalidateQueries({ queryKey: ['noble-royalty'] })
            queryClient.invalidateQueries({ queryKey: ['my-stickers'] })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not publish sticker.'),
    })

    const publishBorder = useMutation({
        mutationFn: (id: string) => nobleRoyaltyApi.publishBorder(id),
        onSuccess: (res) => {
            toast.success(res.data?.message ?? 'Border published.')
            queryClient.invalidateQueries({ queryKey: ['noble-royalty'] })
            queryClient.invalidateQueries({ queryKey: ['artist-profile'] })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not publish border.'),
    })

    const purchaseSticker = useMutation({
        mutationFn: (id: string) => nobleRoyaltyApi.purchaseSticker(id),
        onSuccess: () => {
            toast.success('Sticker added to your library.')
            queryClient.invalidateQueries({ queryKey: ['noble-royalty'] })
            queryClient.invalidateQueries({ queryKey: ['my-stickers'] })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not buy sticker.'),
    })

    const busy = publishSticker.isPending || publishBorder.isPending || purchaseSticker.isPending
    const data = royalty.data

    const counts = useMemo(
        () => ({
            stickers: data?.stickers.length ?? 0,
            borders: data?.borders.length ?? 0,
            message_design: data?.designs.filter((item) => item.type === 'message_design').length ?? 0,
            message_background: data?.designs.filter((item) => item.type === 'message_background').length ?? 0,
            comment_border: data?.designs.filter((item) => item.type === 'comment_border').length ?? 0,
            board_button: data?.designs.filter((item) => item.type === 'board_button').length ?? 0,
        }),
        [data]
    )

    const currentDesignItems = useMemo(
        () => data?.designs.filter((item) => item.type === tab) ?? [],
        [data?.designs, tab]
    )

    return (
        <main className="mx-auto max-w-[1360px] px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Crown className="h-6 w-6 text-amber-500" />
                        <h1 className="text-2xl font-bold tracking-tight">Noble Royalty</h1>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Browse stickers, borders, and design assets from admin and artists.
                    </p>
                </div>
                {user?.role === 'storyteller' && (
                    <div className="flex flex-wrap gap-2">
                        <StickerUploadDialog open={stickerOpen} onOpenChange={setStickerOpen} />
                        <BorderUploadDialog open={borderOpen} onOpenChange={setBorderOpen} />
                        <MessageBackgroundUploadDialog open={backgroundOpen} onOpenChange={setBackgroundOpen} />
                    </div>
                )}
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
                {TABS.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => setTab(item)}
                        className={`rounded-lg border px-4 py-2 text-sm capitalize ${
                            tab === item ? 'bg-foreground text-background' : 'bg-background'
                        }`}
                    >
                        {TAB_LABELS[item]} ({counts[item]})
                    </button>
                ))}
            </div>

            {royalty.isLoading ? (
                <div className="rounded-lg border p-8 text-sm text-muted-foreground">Loading Noble Royalty...</div>
            ) : tab === 'stickers' ? (
                <AssetGrid
                    items={data?.stickers ?? []}
                    empty="No stickers are available yet."
                    publishCost={data?.publish_cost ?? 20}
                    busy={busy}
                    onPublish={(item) => publishSticker.mutate(item.id)}
                    onPurchase={(item) => purchaseSticker.mutate(item.id)}
                />
            ) : tab === 'borders' ? (
                <AssetGrid
                    items={data?.borders ?? []}
                    empty="No borders are available yet."
                    publishCost={data?.publish_cost ?? 20}
                    busy={busy}
                    onPublish={(item) => publishBorder.mutate(item.id)}
                />
            ) : (
                <DesignGrid items={currentDesignItems} empty={`No ${TAB_LABELS[tab].toLowerCase()} assets are available yet.`} />
            )}
        </main>
    )
}

function StickerUploadDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const queryClient = useQueryClient()
    const [isBundle, setIsBundle] = useState(false)
    const [bundleName, setBundleName] = useState('')
    const [isFree, setIsFree] = useState(false)
    const [creditCost, setCreditCost] = useState(1)
    const [publishPublic, setPublishPublic] = useState(false)
    const [subscriptionFree, setSubscriptionFree] = useState(false)
    const [uploads, setUploads] = useState<StickerUpload[]>([])
    const [fileKey, setFileKey] = useState(0)

    const createSticker = useMutation({
        mutationFn: (payload: FormData) => stickersApi.create(payload).then((res) => res.data),
        onSuccess: () => {
            toast.success(uploads.length === 1 ? 'Sticker added.' : 'Sticker bundle added.')
            queryClient.invalidateQueries({ queryKey: ['noble-royalty'] })
            queryClient.invalidateQueries({ queryKey: ['my-stickers'] })
            reset()
            onOpenChange(false)
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? (publishPublic ? 'Could not add and publish sticker. Check your credits.' : 'Could not add sticker.')),
    })

    const reset = () => {
        uploads.forEach((upload) => URL.revokeObjectURL(upload.previewUrl))
        setIsBundle(false)
        setBundleName('')
        setIsFree(false)
        setCreditCost(1)
        setPublishPublic(false)
        setSubscriptionFree(false)
        setUploads([])
        setFileKey((current) => current + 1)
    }

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (uploads.length === 0) {
            toast.error('Choose at least one sticker image.')
            return
        }

        if (isBundle && !bundleName.trim()) {
            toast.error('Bundle name is required when creating a bundle.')
            return
        }

        if (publishPublic && !isFree && creditCost < 1) {
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
            payload.append('sticker_names[]', upload.name.trim() || stickerNameFromFile(upload.file))
        })

        createSticker.mutate(payload)
    }

    const removeUpload = (index: number) => {
        setUploads((current) => {
            current[index] && URL.revokeObjectURL(current[index].previewUrl)
            return current.filter((_, itemIndex) => itemIndex !== index)
        })
        setFileKey((current) => current + 1)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="h-4 w-4" />
                    Add Stickers
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={submit} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>Add Stickers</DialogTitle>
                        <DialogDescription>
                            Upload private stickers or publish public Noble Royalty stickers. Names are optional.
                        </DialogDescription>
                    </DialogHeader>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={isBundle}
                            onChange={(event) => setIsBundle(event.target.checked)}
                        />
                        Create as bundle
                    </label>
                    <div className="grid gap-1">
                        <Label>Bundle name{isBundle ? '' : ', optional'}</Label>
                        <Input
                            value={bundleName}
                            disabled={!isBundle}
                            onChange={(event) => setBundleName(event.target.value)}
                            placeholder={isBundle ? 'Bundle name' : 'Solo stickers do not need a bundle'}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label>Visibility</Label>
                        <select
                            value={publishPublic ? 'public' : 'private'}
                            onChange={(event) => {
                                const isPublic = event.target.value === 'public'
                                setPublishPublic(isPublic)
                                if (!isPublic) setSubscriptionFree(false)
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
                                <Label>{isBundle ? 'Bundle credit cost' : 'Credit cost per sticker'}</Label>
                                <Input
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
                        <Label>Sticker images</Label>
                        <Input
                            key={fileKey}
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
                    </div>
                    {uploads.length > 0 && (
                        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                            {uploads.map((upload, index) => (
                                <div
                                    key={`${upload.file.name}-${index}`}
                                    className="grid grid-cols-[64px_1fr_auto] items-end gap-3 rounded-md bg-muted/30 p-2"
                                >
                                    <div className="h-16 w-16 overflow-hidden rounded-md border bg-muted/40 p-1">
                                        <img src={upload.previewUrl} alt="" className="h-full w-full object-contain" />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label>Sticker {index + 1} name, optional</Label>
                                        <Input
                                            value={upload.name}
                                            onChange={(event) =>
                                                setUploads((current) =>
                                                    current.map((item, itemIndex) =>
                                                        itemIndex === index ? { ...item, name: event.target.value } : item
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
                        <Button type="submit" disabled={createSticker.isPending}>
                            <Plus className="h-4 w-4" />
                            {publishPublic ? 'Add and Publish' : 'Add Private'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function AssetGrid<T extends ArtistSticker | ProfileBorder>({
    items,
    empty,
    publishCost,
    busy,
    onPublish,
    onPurchase,
}: {
    items: T[]
    empty: string
    publishCost: number
    busy: boolean
    onPublish: (item: T) => void
    onPurchase?: (item: T) => void
}) {
    if (items.length === 0) {
        return <div className="rounded-lg border p-8 text-sm text-muted-foreground">{empty}</div>
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
            {items.map((item) => (
                <article key={item.id} className="rounded-lg border bg-background p-3">
                    <div className="flex h-[170px] items-center justify-center overflow-hidden rounded-md bg-muted/30 p-3">
                        <img src={storageUrl(item.image_path)!} alt={item.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="mt-3 min-w-0">
                        <h2 className="truncate text-sm font-semibold">{item.name}</h2>
                        <p className="truncate text-xs text-muted-foreground">
                            {item.owner?.username ? `@${item.owner.username}` : item.user_id ? 'Artist asset' : 'Admin asset'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {item.can_use && <Badge variant="secondary">Usable</Badge>}
                            {item.gifted && <Badge variant="outline">Gifted</Badge>}
                            {item.subscription_free && <Badge variant="outline">Subscription</Badge>}
                            {item.is_public ? <Badge variant="outline">Public</Badge> : <Badge variant="secondary">Private</Badge>}
                            {item.is_public && 'purchase_cost' in item && (
                                <Badge variant="outline">
                                    {(item.purchase_cost ?? item.credit_cost ?? 0) <= 0
                                        ? 'Free'
                                        : `${item.purchase_cost ?? item.credit_cost} credits`}
                                </Badge>
                            )}
                        </div>
                        {item.owned && !item.is_public && (
                            <Button
                                className="mt-3 w-full"
                                size="sm"
                                disabled={busy}
                                onClick={() => onPublish(item)}
                            >
                                <Upload className="h-4 w-4" />
                                Publish {publishCost} credits
                            </Button>
                        )}
                        {onPurchase && item.is_public && !item.can_use && !item.owned && 'purchase_cost' in item && (
                            <Button
                                className="mt-3 w-full"
                                size="sm"
                                disabled={busy}
                                onClick={() => onPurchase(item)}
                            >
                                {(item.purchase_cost ?? item.credit_cost ?? 0) <= 0
                                    ? 'Get Free Sticker'
                                    : `Buy for ${item.purchase_cost ?? item.credit_cost} credits`}
                            </Button>
                        )}
                    </div>
                </article>
            ))}
        </div>
    )
}

function DesignGrid({ items, empty }: { items: RoyaltyDesignAsset[]; empty: string }) {
    if (items.length === 0) {
        return <div className="rounded-lg border p-8 text-sm text-muted-foreground">{empty}</div>
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {items.map((item) => (
                <article key={item.id} className="rounded-lg border bg-background p-3">
                    <div className="flex h-[180px] items-center justify-center overflow-hidden rounded-md bg-muted/30 p-3">
                        <img src={storageUrl(item.image_path)!} alt={item.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="mt-3">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="truncate text-sm font-semibold">{item.name}</h2>
                            {item.gifted && <Gift className="h-4 w-4 text-amber-500" />}
                        </div>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">{item.type.replaceAll('_', ' ')}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {item.subscription_free && <Badge variant="outline">Subscription</Badge>}
                            {item.is_public === false ? <Badge variant="secondary">Private</Badge> : <Badge variant="outline">Public</Badge>}
                        </div>
                    </div>
                </article>
            ))}
        </div>
    )
}

function stickerNameFromFile(file: File) {
    return file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()
}

function BorderUploadDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const queryClient = useQueryClient()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [publishPublic, setPublishPublic] = useState(false)
    const [subscriptionFree, setSubscriptionFree] = useState(false)

    const createBorder = useMutation({
        mutationFn: (payload: FormData) => nobleRoyaltyApi.createBorder(payload),
        onSuccess: (res) => {
            toast.success(res.data?.message ?? 'Border saved.')
            queryClient.invalidateQueries({ queryKey: ['noble-royalty'] })
            setName('')
            setDescription('')
            setFile(null)
            setPublishPublic(false)
            setSubscriptionFree(false)
            onOpenChange(false)
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not add border.'),
    })

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!file) {
            toast.error('Border PNG/GIF image is required.')
            return
        }

        const payload = new FormData()
        payload.append('name', name.trim())
        payload.append('description', description.trim())
        payload.append('image', file)
        payload.append('is_free', '1')
        payload.append('credit_cost', '0')
        payload.append('publish_public', publishPublic ? '1' : '0')
        payload.append('subscription_free', subscriptionFree ? '1' : '0')
        createBorder.mutate(payload)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Paintbrush className="h-4 w-4" />
                    Add Border
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Add Border</DialogTitle>
                        <DialogDescription>
                            Keep it private for yourself, or publish publicly now for 20 credits unless you have an active subscription.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Name, optional</Label>
                            <Input value={name} onChange={(event) => setName(event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Border PNG or GIF</Label>
                            <Input
                                type="file"
                                accept="image/png,image/webp,image/gif"
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Visibility</Label>
                            <select
                                value={publishPublic ? 'public' : 'private'}
                                onChange={(event) => {
                                    const isPublic = event.target.value === 'public'
                                    setPublishPublic(isPublic)
                                    if (!isPublic) setSubscriptionFree(false)
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
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={subscriptionFree}
                                    onChange={(event) => setSubscriptionFree(event.target.checked)}
                                />
                                Unlock for subscribers
                            </label>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createBorder.isPending}>
                            <Sparkles className="h-4 w-4" />
                            {publishPublic ? 'Save and Publish Border' : 'Save Private Border'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function MessageBackgroundUploadDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const queryClient = useQueryClient()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [publishPublic, setPublishPublic] = useState(false)
    const [subscriptionFree, setSubscriptionFree] = useState(false)

    const createBackground = useMutation({
        mutationFn: (payload: FormData) => nobleRoyaltyApi.createMessageBackground(payload),
        onSuccess: (res) => {
            toast.success(res.data?.message ?? 'Message background saved.')
            queryClient.invalidateQueries({ queryKey: ['noble-royalty'] })
            setName('')
            setDescription('')
            setFile(null)
            setPublishPublic(false)
            setSubscriptionFree(false)
            onOpenChange(false)
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not add message background.'),
    })

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!file) {
            toast.error('Message background image or GIF is required.')
            return
        }

        const payload = new FormData()
        payload.append('name', name.trim())
        payload.append('description', description.trim())
        payload.append('image', file)
        payload.append('publish_public', publishPublic ? '1' : '0')
        payload.append('subscription_free', subscriptionFree ? '1' : '0')
        createBackground.mutate(payload)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Sparkles className="h-4 w-4" />
                    Add Message Background
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Add Message Background</DialogTitle>
                        <DialogDescription>
                            Artists can create message backgrounds privately or publish them publicly for 20 credits unless subscribed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Name, optional</Label>
                            <Input value={name} onChange={(event) => setName(event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Image or GIF</Label>
                            <Input
                                type="file"
                                accept="image/png,image/webp,image/gif,image/jpeg"
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Visibility</Label>
                            <select
                                value={publishPublic ? 'public' : 'private'}
                                onChange={(event) => {
                                    const isPublic = event.target.value === 'public'
                                    setPublishPublic(isPublic)
                                    if (!isPublic) setSubscriptionFree(false)
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
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={subscriptionFree}
                                    onChange={(event) => setSubscriptionFree(event.target.checked)}
                                />
                                Unlock for subscribers
                            </label>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createBackground.isPending}>
                            {publishPublic ? 'Save and Publish' : 'Save Private Background'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
