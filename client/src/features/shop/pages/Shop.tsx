import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Download,
    Heart,
    MessageCircle,
    Palette,
    ShoppingBag,
    Sparkles,
    Star,
    UserRound,
    X,
} from 'lucide-react'
import { nobleRoyaltyApi } from '@/api/nobleRoyalty'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type ShopDownload = {
    id: string
    slug: string
    title: string
    description?: string | null
    labels: string[]
    image_path: string | null
    download_policy: 'free' | 'paid'
    credit_cost: number
    download_unlocked?: boolean
    files_count: number
    likes: number
    comments_count: number
    downloads_count: number
    created_at?: string
    href: string
    artist?: {
        id?: string
        name: string
        username: string
        avatar?: string | null
        verified?: boolean
    } | null
}

type ShopSticker = {
    id: string
    name: string
    bundle_name?: string | null
    image_path: string | null
    is_free: boolean
    credit_cost: number
    href: string
    usage: {
        comments: boolean
        profile: boolean
        backgrounds: boolean
        messages: boolean
    }
    artist?: { name: string; username: string; avatar?: string | null } | null
}

export default function Shop() {
    const queryClient = useQueryClient()
    const [selectedItem, setSelectedItem] = useState<ShopDownload | null>(null)
    const shop = useQuery({
        queryKey: ['public-shop'],
        queryFn: () => publicApi.getShop().then((res) => res.data),
    })
    const purchaseSticker = useMutation({
        mutationFn: (id: string) => nobleRoyaltyApi.purchaseSticker(id),
        onSuccess: () => {
            toast.success('Sticker added to your library.')
            queryClient.invalidateQueries({ queryKey: ['public-shop'] })
            queryClient.invalidateQueries({ queryKey: ['noble-royalty'] })
            queryClient.invalidateQueries({ queryKey: ['artist-sticker-library'] })
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message ?? 'Could not buy this sticker.')
        },
    })

    const downloads = (shop.data?.downloads?.data ?? []) as ShopDownload[]
    const stickers = (shop.data?.stickers ?? []) as ShopSticker[]

    return (
        <main className="mx-auto w-full max-w-[1360px] px-4 py-10 sm:px-6">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6" />
                        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Buy ready-made products, adoptables, files, and stickers from creators.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link to="/noble-royalty">Browse Noble Royalty</Link>
                </Button>
            </div>

            <ShopSection
                title="Creator Products"
                description="Downloadable art products, adoptables, ZIP bundles, and ready-made files."
                empty="No shop products yet."
                loading={shop.isLoading}
                count={downloads.length}
            >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {downloads.map((item, index) => (
                        <ShopProductCard
                            key={item.id}
                            item={item}
                            rank={index + 1}
                            onOpen={() => setSelectedItem(item)}
                        />
                    ))}
                </div>
            </ShopSection>

            <ShopSection
                title="Sticker Shop"
                description="Stickers usable in comments, profiles, message backgrounds, and messages."
                empty="No public stickers yet."
                loading={shop.isLoading}
                count={stickers.length}
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {stickers.map((item) => (
                        <article
                            key={item.id}
                            className="rounded-lg border bg-background p-3 transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex aspect-square items-center justify-center rounded-md bg-muted/40">
                                {item.image_path ? (
                                    <img
                                        src={storageUrl(item.image_path)!}
                                        alt={item.name}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : null}
                            </div>
                            <h3 className="mt-3 truncate text-sm font-semibold">{item.name}</h3>
                            <p className="truncate text-xs text-muted-foreground">
                                {item.bundle_name || `@${item.artist?.username ?? 'artist'}`}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1 text-muted-foreground">
                                <MessageCircle className="h-3.5 w-3.5" />
                                <UserRound className="h-3.5 w-3.5" />
                                <Palette className="h-3.5 w-3.5" />
                                <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <div className="mt-2 text-xs font-semibold">
                                {item.is_free ? 'Free' : `${item.credit_cost} credits`}
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                className="mt-3 w-full"
                                variant={item.is_free ? 'secondary' : 'default'}
                                onClick={() => purchaseSticker.mutate(item.id)}
                                disabled={purchaseSticker.isPending}
                            >
                                {item.is_free ? 'Add to library' : 'Buy sticker'}
                            </Button>
                        </article>
                    ))}
                </div>
            </ShopSection>

            <ShopProductModal item={selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)} />
        </main>
    )
}

function ShopProductCard({
    item,
    rank,
    onOpen,
}: {
    item: ShopDownload
    rank: number
    onOpen: () => void
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="group rounded-[28px] bg-background p-4 text-left shadow-[0_18px_42px_rgba(15,23,42,0.12)] ring-1 ring-foreground/10 transition hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(15,23,42,0.16)]"
        >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-muted">
                {item.image_path ? (
                    <img
                        src={storageUrl(item.image_path)!}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-8 w-8" />
                    </div>
                )}
                <div className="absolute left-3 top-3 flex gap-2">
                    {rank <= 3 && (
                        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-orange-500 shadow-sm">
                            Popular
                        </span>
                    )}
                    {isNewItem(item) && (
                        <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                            New
                        </span>
                    )}
                </div>
                <span className="absolute right-3 top-0 bg-red-500 px-3 py-4 text-lg font-bold text-white [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]">
                    {rank}
                </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
                <ArtistAvatar item={item} />
                <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-orange-500">
                        {item.artist?.name ?? 'Creator'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        @{item.artist?.username ?? 'artist'}
                    </p>
                </div>
            </div>
            <h3 className="mt-3 line-clamp-2 min-h-[2.75rem] text-base font-semibold text-muted-foreground">
                {item.title}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">
                    {item.download_policy === 'free' ? 'Free' : `${item.credit_cost} credits`}
                </span>
                <span className="text-muted-foreground">{item.downloads_count} sold</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                    5.0
                </span>
            </div>
        </button>
    )
}

function ShopProductModal({
    item,
    onOpenChange,
}: {
    item: ShopDownload | null
    onOpenChange: (open: boolean) => void
}) {
    const queryClient = useQueryClient()
    const purchaseMutation = useMutation({
        mutationFn: () => publicApi.purchaseShopDownload(item!.id).then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['public-shop'] })
            queryClient.invalidateQueries({ queryKey: ['public-shop-widget'] })
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message ?? 'Could not buy this product.')
        },
    })

    if (!item) return null

    const price = item.download_policy === 'free' ? 'Free' : `${item.credit_cost} credits`
    const handleDownload = async () => {
        try {
            if (item.download_policy === 'paid' && !item.download_unlocked) {
                const result = await purchaseMutation.mutateAsync()
                if (!result.unlocked) return
                toast.success(result.message ?? 'Shop product unlocked.')
            }

            const response = await publicApi.downloadShopItem(item.id)
            saveDownloadBlob(response.data, responseFileName(response, `${slugify(item.title)}.zip`))
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Could not download this product.')
        }
    }

    return (
        <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
            <DialogContent className="h-[92dvh] !w-[calc(100vw-1rem)] !max-w-none overflow-hidden rounded-[28px] p-0 sm:!max-w-none lg:!w-[min(94vw,1320px)]">
                <DialogHeader className="sr-only">
                    <DialogTitle>{item.title}</DialogTitle>
                    <DialogDescription>Shop product details</DialogDescription>
                </DialogHeader>
                <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)]">
                    <div className="min-h-0 bg-muted/40 p-3 lg:p-4">
                        <div className="h-full overflow-hidden rounded-[22px] bg-background">
                            {item.image_path ? (
                                <img
                                    src={storageUrl(item.image_path)!}
                                    alt={item.title}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    <ShoppingBag className="h-10 w-10" />
                                </div>
                            )}
                        </div>
                    </div>
                    <aside className="min-h-0 overflow-y-auto p-5 lg:p-6">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <ArtistAvatar item={item} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-orange-500">
                                        {item.artist?.name ?? 'Creator'}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        @{item.artist?.username ?? 'artist'}
                                    </p>
                                </div>
                            </div>
                            <Button type="button" size="icon-sm" variant="ghost" onClick={() => onOpenChange(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight">{item.title}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-semibold text-blue-500">{price}</span>
                            <span className="text-muted-foreground">{item.downloads_count} sold</span>
                            <span className="inline-flex items-center gap-1">
                                <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                                5.0
                            </span>
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <Heart className="h-4 w-4" />
                                {item.likes.toLocaleString()}
                            </span>
                        </div>

                        {item.labels.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {item.labels.map((label) => (
                                    <Badge key={label} variant="secondary" className="rounded-full">
                                        #{label}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="mt-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Description
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                {item.description || 'No description added.'}
                            </p>
                        </div>

                        <div className="mt-5 rounded-xl border bg-muted/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Included files
                            </p>
                            <p className="mt-2 text-sm font-medium">
                                {item.files_count} file{item.files_count === 1 ? '' : 's'} included
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {item.download_policy === 'free'
                                    ? 'This product can be downloaded for free.'
                                    : item.download_unlocked
                                      ? 'You already unlocked this product.'
                                      : 'Buy this product to unlock the original downloadable files.'}
                            </p>
                        </div>

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                            <Button
                                type="button"
                                className="flex-1"
                                onClick={handleDownload}
                                disabled={purchaseMutation.isPending}
                            >
                                <Download className="h-4 w-4" />
                                {purchaseMutation.isPending
                                    ? 'Processing...'
                                    : item.download_policy === 'free' || item.download_unlocked
                                      ? 'Download'
                                      : 'Buy & Download'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => shareShopItem(item)}>
                                Share
                            </Button>
                        </div>

                        <div className="mt-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-semibold">Comments</h3>
                                <span className="text-xs text-muted-foreground">
                                    {item.comments_count} comments
                                </span>
                            </div>
                            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                Product comments will use the same comment design system after the shop checkout flow is connected.
                            </div>
                        </div>
                    </aside>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ArtistAvatar({ item }: { item: ShopDownload }) {
    const avatar = item.artist?.avatar

    return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-lg font-semibold text-white">
            {avatar ? (
                <img src={storageUrl(avatar)!} alt={item.artist?.name ?? 'Artist'} className="h-full w-full object-cover" />
            ) : (
                (item.artist?.name ?? 'A').charAt(0).toUpperCase()
            )}
        </div>
    )
}

function ShopSection({
    title,
    description,
    empty,
    loading,
    count,
    children,
}: {
    title: string
    description: string
    empty: string
    loading: boolean
    count: number
    children: ReactNode
}) {
    return (
        <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Download className="h-5 w-5 text-muted-foreground" />
            </div>
            {loading ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                    Loading shop...
                </div>
            ) : count === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {empty}
                </div>
            ) : (
                children
            )}
        </section>
    )
}

function isNewItem(item: ShopDownload) {
    if (!item.created_at) return false

    const createdAt = new Date(item.created_at).getTime()
    if (Number.isNaN(createdAt)) return false

    return Date.now() - createdAt <= 30 * 24 * 60 * 60 * 1000
}

async function shareShopItem(item: ShopDownload) {
    const url = `${window.location.origin}/shop?item=${encodeURIComponent(item.slug || item.id)}`

    try {
        if (navigator.share) {
            await navigator.share({ title: item.title, url })
            return
        }

        await navigator.clipboard.writeText(url)
        toast.success('Shop link copied.')
    } catch {
        toast.error('Could not share this product.')
    }
}

function responseFileName(response: any, fallback: string) {
    const disposition = response?.headers?.['content-disposition'] as string | undefined
    const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
    if (!match?.[1]) return fallback

    try {
        return decodeURIComponent(match[1].replace(/"/g, ''))
    } catch {
        return match[1].replace(/"/g, '') || fallback
    }
}

function saveDownloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

function slugify(value: string) {
    return (
        value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'shop-product'
    )
}
