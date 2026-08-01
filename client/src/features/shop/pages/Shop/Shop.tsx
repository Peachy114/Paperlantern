import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    MessageCircle,
    Palette,
    ShoppingBag,
    Sparkles,
    UserRound,
} from 'lucide-react'
import { nobleRoyaltyApi } from '@/api/nobleRoyalty'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import type { PageLayout } from '@/types/pageLayout'
import type { ShopDownload, ShopSticker } from './types'
import { shopCategories } from './utils/shopCategories'
import { ShopCategoryRail } from './ShopCategoryRail'
import { ShopPageWidgets } from './ShopPageWidgets'
import { ShopProductCard } from './ShopProductCard'
import { ShopProductModal } from './ShopProductModal'
import { ShopSection } from './ShopSection'
// import { SourceBadge } from './SourceBadge'
import { filterShopDownloads } from './utils/filterShopDownloads'
import { filterShopStickers } from './utils/filterShopStickers'
import { stickerShopCategories } from './utils/stickerShopCategories'



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
        onSuccess: (_response, stickerId) => {
            toast.success('Sticker added to your library.')

            queryClient.setQueryData(['public-shop'], (current: any) => {
                if (!current) return current

                return {
                    ...current,
                    stickers: (current.stickers ?? []).map((sticker: ShopSticker) =>
                        sticker.id === stickerId
                            ? { ...sticker, owned: true, can_use: true }
                            : sticker
                    ),
                }
            })

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
                            {/* <SourceBadge
                                source={item.source}
                                label={item.source_label}
                                className="mt-2"
                            /> */}
                            <div className="mt-2 flex flex-wrap gap-1 text-muted-foreground">
                                <MessageCircle className="h-3.5 w-3.5" />
                                <UserRound className="h-3.5 w-3.5" />
                                <Palette className="h-3.5 w-3.5" />
                                <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <div className="mt-2 text-xs font-semibold">
                                {item.is_free ? 'Free' : `${item.credit_cost} credits`}
                            </div>
                            {(() => {
                                const isOwned = Boolean(item.owned || item.can_use)
                                const isPurchasingThisSticker =
                                    purchaseSticker.isPending &&
                                    purchaseSticker.variables === item.id

                                return (
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="mt-3 w-full"
                                        variant={isOwned || item.is_free ? 'secondary' : 'default'}
                                        onClick={() => {
                                            if (!isOwned) purchaseSticker.mutate(item.id)
                                        }}
                                        disabled={isOwned || purchaseSticker.isPending}
                                    >
                                        {isOwned
                                            ? 'Owned'
                                            : isPurchasingThisSticker
                                              ? 'Adding...'
                                              : item.is_free
                                                ? 'Add to library'
                                                : 'Buy sticker'}
                                    </Button>
                                )
                            })()}
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