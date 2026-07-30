import { useMemo, useState, type ReactNode } from 'react'
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
import FeaturedHeroWidget from '@/features/page-builder/FeaturedHeroWidget'
import GroupHeroWidget from '@/features/page-builder/GroupHeroWidget'
import ShopCardWidget from '@/features/page-builder/ShopCardWidget'
import StickerShopWidget from '@/features/page-builder/StickerShopWidget'
import SharedDiscoveryWidget, {
    isSharedDiscoveryWidget,
} from '@/features/page-builder/SharedDiscoveryWidget'
import { CustomPageWidget, PageWidgetFrame } from '@/features/page-builder/PageWidgetFrame'
import type { PageLayout, PageWidget } from '@/types/pageLayout'
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
    price?: number | string | null
    currency?: string | null
    rating?: number | null
    sold_count?: number | null
    is_popular?: boolean
    is_new?: boolean
    download_unlocked?: boolean
    files_count: number
    likes: number
    comments_count: number
    downloads_count: number
    created_at?: string
    href: string
    source?: 'admin' | 'artist'
    source_label?: string
    artist?: {
        id?: string
        name: string
        username: string
        avatar?: string | null
        verified?: boolean
        badges?: string[]
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
    source?: 'admin' | 'artist'
    source_label?: string
}

export default function Shop() {
    const queryClient = useQueryClient()
    const [selectedItem, setSelectedItem] = useState<ShopDownload | null>(null)
    const [productCategory, setProductCategory] = useState('all')
    const [stickerCategory, setStickerCategory] = useState('all')
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
    const layout = shop.data?.layout as PageLayout | undefined
    const pageWidgets = (layout?.widgets ?? []).filter((widget) => widget.enabled)
    const hasSavedPageBuilderLayout = Boolean(
        layout && layout.is_default === false && pageWidgets.length > 0
    )
    const productCategories = useMemo(() => shopCategories(downloads), [downloads])
    const stickerCategories = useMemo(() => stickerShopCategories(stickers), [stickers])
    const filteredDownloads = useMemo(
        () => filterShopDownloads(downloads, productCategory),
        [downloads, productCategory]
    )
    const filteredStickers = useMemo(
        () => filterShopStickers(stickers, stickerCategory),
        [stickers, stickerCategory]
    )

    if (hasSavedPageBuilderLayout) {
        return <ShopPageWidgets widgets={pageWidgets} />
    }

    return (
        <main className="mx-auto w-full max-w-[1480px] px-4 py-10 sm:px-6">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6" />
                        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
                    </div>
                    {/* <p className="mt-1 text-sm text-muted-foreground">
                        Buy ready-made products, adoptables, files, and stickers from creators.
                    </p> */}
                </div>
                <Button asChild variant="outline">
                    <Link to="/noble-royalty">Browse Noble Royalty</Link>
                </Button>
            </div>

            <ShopSection
                title="Creator Products"
                empty="No shop products yet."
                loading={shop.isLoading}
                count={filteredDownloads.length}
            >
                <ShopCategoryRail
                    categories={productCategories}
                    active={productCategory}
                    onChange={setProductCategory}
                />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredDownloads.map((item, index) => (
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
                empty="No public stickers yet."
                loading={shop.isLoading}
                count={filteredStickers.length}
            >
                <ShopCategoryRail
                    categories={stickerCategories}
                    active={stickerCategory}
                    onChange={setStickerCategory}
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {filteredStickers.map((item) => (
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
                            <SourceBadge
                                source={item.source}
                                label={item.source_label}
                                className="mt-2"
                            />
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

            <ShopProductModal
                item={selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
            />
        </main>
    )
}

function ShopPageWidgets({ widgets }: { widgets: PageWidget[] }) {
    return (
        <main className="w-full">
            {widgets.map((widget) => {
                if (widget.type === 'shop_card') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <ShopCardWidget widget={widget} />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'sticker_shop') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <StickerShopWidget widget={widget} />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'featured_hero') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <FeaturedHeroWidget widget={widget} works={[]} />
                        </PageWidgetFrame>
                    )
                }

                if (widget.type === 'group_hero') {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <GroupHeroWidget widget={widget} works={[]} />
                        </PageWidgetFrame>
                    )
                }

                if (isSharedDiscoveryWidget(widget.type)) {
                    return (
                        <PageWidgetFrame key={widget.id} widget={widget}>
                            <SharedDiscoveryWidget widget={widget} widgets={widgets} />
                        </PageWidgetFrame>
                    )
                }

                return <CustomPageWidget key={widget.id} widget={widget} />
            })}
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
    const price = shopProductPrice(item)
    const soldCount = item.sold_count ?? item.downloads_count
    const rating = Number.isFinite(item.rating) ? Number(item.rating).toFixed(1) : '5.0'
    const isPopular = item.is_popular ?? rank <= 3
    const isNew = item.is_new ?? isNewItem(item)
    const artistBadges =
        item.artist?.badges?.slice(0, 2) ?? (item.artist?.verified ? ['☀️', '💎'] : [])

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`Open ${item.title}`}
            className="
                group
                h-full
                w-full
                overflow-hidden
                rounded-[36px]
                bg-card
                p-3
                text-left
                text-foreground
                shadow-[0_14px_32px_rgba(15,23,42,0.16)]
                transition
                duration-300
                hover:-translate-y-1
                hover:shadow-[0_20px_42px_rgba(15,23,42,0.20)]
                focus-visible:outline-none
                focus-visible:ring-4
                focus-visible:ring-orange-400/35
            "
        >
            <div className="relative aspect-[9/8] overflow-hidden rounded-[26px] bg-muted">
                {item.image_path ? (
                    <img
                        src={storageUrl(item.image_path)!}
                        alt={item.title}
                        className="
                            h-full
                            w-full
                            object-cover
                            transition-transform
                            duration-500
                            ease-out
                            group-hover:scale-[1.035]
                        "
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-[#8a8a8a]">
                        <ShoppingBag className="h-9 w-9" />
                    </div>
                )}

                <div className="absolute left-4 top-3 z-10 flex items-center gap-2">
                    <SourceBadge source={item.source} label={item.source_label} />
                    {isPopular && (
                        <span
                            className="
                                inline-flex
                                h-9
                                items-center
                                rounded-full
                                bg-background
                                px-3.5
                                text-[13px]
                                font-medium
                                text-[#ff8a00]
                                shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                            "
                        >
                            Popular&nbsp;🔥
                        </span>
                    )}

                    {isNew && (
                        <span
                            className="
                                inline-flex
                                h-9
                                items-center
                                rounded-full
                                bg-[#ff4f79]
                                px-5
                                text-[18px]
                                font-medium
                                text-white
                                shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                            "
                        >
                            New
                        </span>
                    )}
                </div>

                <span
                    className="
                        absolute
                        right-7
                        top-0
                        z-10
                        flex
                        h-[54px]
                        min-w-10
                        items-start
                        justify-center
                        bg-[#ff1010]
                        px-2
                        pt-1
                        text-[18px]
                        font-semibold
                        leading-8
                        text-white
                        [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]
                    "
                    aria-label={`Rank ${rank}`}
                >
                    {rank}
                </span>
            </div>

            <div className="px-0.5 pb-5 pt-3">
                <div className="flex min-w-0 items-center gap-3">
                    <ArtistAvatar item={item} className="h-[52px] w-[52px] text-xl" />

                    <div className="flex min-w-0 flex-1 items-center gap-1">
                        <p className="truncate text-[17px] font-medium text-[#ff8500]">
                            {item.artist?.name ?? 'Creator'}
                        </p>

                        {artistBadges.map((badge, index) => (
                            <span
                                key={`${badge}-${index}`}
                                className="shrink-0 text-[17px] leading-none"
                                aria-hidden="true"
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                </div>

                <h3 className="mt-3 truncate text-[16px] font-medium text-muted-foreground">
                    {item.title}
                </h3>

                <div className="mt-2.5 flex min-w-0 items-center gap-2 whitespace-nowrap text-[15px]">
                    <span className="shrink-0 font-semibold text-foreground">{price}</span>

                    <span className="min-w-0 truncate text-muted-foreground">
                        {soldCount.toLocaleString()} sold
                    </span>

                    <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                        <Star className="h-[21px] w-[21px] fill-[#ff9000] text-[#ff9000]" />
                        {rating}
                    </span>
                </div>
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
            saveDownloadBlob(
                response.data,
                responseFileName(response, `${slugify(item.title)}.zip`)
            )
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
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight">{item.title}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-semibold text-blue-500">{price}</span>
                            <span className="text-muted-foreground">
                                {item.downloads_count} sold
                            </span>
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
                                <SourceBadge source={item.source} label={item.source_label} />
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => shareShopItem(item)}
                            >
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
                                Product comments will use the same comment design system after the
                                shop checkout flow is connected.
                            </div>
                        </div>
                    </aside>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ShopCategoryRail({
    categories,
    active,
    onChange,
}: {
    categories: string[]
    active: string
    onChange: (value: string) => void
}) {
    if (categories.length === 0) return null

    return (
        <div className="mb-5 overflow-hidden rounded-2xl border bg-background/95 shadow-sm">
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
                <ShopCategoryButton active={active === 'all'} onClick={() => onChange('all')}>
                    All category
                </ShopCategoryButton>
                {categories.map((category) => (
                    <ShopCategoryButton
                        key={category}
                        active={active === category}
                        onClick={() => onChange(category)}
                    >
                        {category}
                    </ShopCategoryButton>
                ))}
            </div>
        </div>
    )
}

function ShopCategoryButton({
    active,
    children,
    onClick,
}: {
    active: boolean
    children: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition ${
                active ? 'bg-background text-foreground shadow' : 'text-foreground hover:bg-muted'
            }`}
        >
            {children}
        </button>
    )
}

function SourceBadge({
    source,
    label,
    className = '',
}: {
    source?: 'admin' | 'artist'
    label?: string
    className?: string
}) {
    const byAdmin = source === 'admin'

    return (
        <span
            className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                byAdmin
                    ? 'bg-sky-500 text-white'
                    : 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300'
            } ${className}`}
        >
            {label ?? (byAdmin ? 'By Admin' : 'By Artist')}
        </span>
    )
}

function shopCategories(items: ShopDownload[]) {
    const categories = new Set<string>()
    items.forEach((item) => {
        item.labels.forEach((label) => categories.add(label))
        if (item.source_label) categories.add(item.source_label)
    })

    return Array.from(categories).sort((a, b) => a.localeCompare(b))
}

function stickerShopCategories(items: ShopSticker[]) {
    const categories = new Set<string>()
    items.forEach((item) => {
        if (item.source_label) categories.add(item.source_label)
        if (item.bundle_name) categories.add(item.bundle_name)
        Object.entries(item.usage).forEach(([key, value]) => {
            if (value) categories.add(key.charAt(0).toUpperCase() + key.slice(1))
        })
    })

    return Array.from(categories).sort((a, b) => a.localeCompare(b))
}

function filterShopDownloads(items: ShopDownload[], category: string) {
    if (category === 'all') return items

    return items.filter((item) => item.labels.includes(category) || item.source_label === category)
}

function filterShopStickers(items: ShopSticker[], category: string) {
    if (category === 'all') return items

    return items.filter((item) => {
        if (item.source_label === category || item.bundle_name === category) return true
        const usageKey = category.toLowerCase() as keyof ShopSticker['usage']
        return Boolean(item.usage[usageKey])
    })
}

function ArtistAvatar({
    item,
    className = 'h-12 w-12 text-lg',
}: {
    item: ShopDownload
    className?: string
}) {
    const avatar = item.artist?.avatar

    return (
        <div
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black font-medium text-white ${className}`}
        >
            {avatar ? (
                <img
                    src={storageUrl(avatar)!}
                    alt={item.artist?.name ?? 'Artist'}
                    className="h-full w-full object-cover"
                />
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
    description?: string
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
                    {description ? (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    ) : null}
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

function shopProductPrice(item: ShopDownload) {
    if (item.download_policy === 'free') return 'Free'

    if (typeof item.price === 'number') {
        const currency = item.currency?.toUpperCase() ?? 'PHP'

        if (currency === 'PHP') {
            return `₱${item.price.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}+`
        }

        return `${item.price.toLocaleString()} ${currency}`
    }

    if (typeof item.price === 'string' && item.price.trim()) {
        return item.price.trim()
    }

    return `${item.credit_cost.toLocaleString()} credits`
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
