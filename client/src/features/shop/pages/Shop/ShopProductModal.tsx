import { publicApi } from "@/api/public"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { storageUrl } from "@/utils/storage"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { ShoppingBag, Star, Heart, Download } from "lucide-react"
import { toast } from "sonner"
import { ArtistAvatar } from "./ArtistAvatar"
import CommentSection2 from "@/features/comments/components/CommentSection2"
// import { SourceBadge } from "./SourceBadge"
import type { ShopDownload } from "./types"
import { responseFileName } from "./utils/responseFileName"
import { saveDownloadBlob } from "./utils/saveDownloadBlob"
import { shareShopItem } from "./utils/shareShopItem"
import { slugify } from "./utils/slugify"

export function ShopProductModal({
    item,
    onOpenChange,
}: {
    item: ShopDownload | null
    onOpenChange: (open: boolean) => void
}) {
    const queryClient = useQueryClient()
    const [ratingValue, setRatingValue] = useState(5)
    const [ratingComment, setRatingComment] = useState('')
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
    const rateMutation = useMutation({
        mutationFn: () =>
            publicApi
                .rateShopItem(item!.id, {
                    rating: ratingValue,
                    comment: ratingComment.trim() || undefined,
                })
                .then((res) => res.data),
        onSuccess: () => {
            toast.success('Shop rating saved.')
            queryClient.invalidateQueries({ queryKey: ['public-shop'] })
            queryClient.invalidateQueries({ queryKey: ['public-shop-widget'] })
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message ?? 'Could not save this rating.')
        },
    })

    if (!item) return null

    const price = item.download_policy === 'free' ? 'Free' : `${item.credit_cost} credits`
    const protectPreview = item.download_policy === 'paid' && !item.download_unlocked
    const canRate = item.download_policy === 'free' || item.download_unlocked
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
                        <div className="relative h-full overflow-hidden rounded-[22px] bg-background">
                            {item.image_path ? (
                                <img
                                    src={storageUrl(item.image_path)!}
                                    alt={item.title}
                                    className={`h-full w-full object-contain ${protectPreview ? 'blur-[2px] saturate-75' : ''}`}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    <ShoppingBag className="h-10 w-10" />
                                </div>
                            )}
                            {protectPreview && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle,rgba(255,255,255,0.20)_1px,transparent_1px)] [background-size:8px_8px]">
                                    <span className="-rotate-12 rounded-full bg-black/55 px-5 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white">
                                        LaternComix Preview
                                    </span>
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
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight">{item.title}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-semibold text-blue-500">{price}</span>
                            <span className="text-muted-foreground">
                                {item.downloads_count} sold
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                                {Number(item.rating ?? 0) > 0
                                    ? Number(item.rating).toFixed(1)
                                    : 'New'}
                                {item.ratings_count ? ` (${item.ratings_count})` : ''}
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
                                {/* <SourceBadge source={item.source} label={item.source_label} /> */}
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
                            <div className="mb-5 rounded-xl border bg-muted/20 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold">Rate this product</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {canRate
                                                ? 'Ratings are available after you own or unlock the product.'
                                                : 'Buy this product first to leave a rating.'}
                                        </p>
                                    </div>
                                    {item.user_rating && (
                                        <Badge variant="secondary">Your rating: {item.user_rating}/5</Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <Button
                                            key={value}
                                            type="button"
                                            size="sm"
                                            variant={ratingValue === value ? 'default' : 'outline'}
                                            onClick={() => setRatingValue(value)}
                                            disabled={!canRate || rateMutation.isPending}
                                        >
                                            <Star className="h-3.5 w-3.5" />
                                            {value}
                                        </Button>
                                    ))}
                                </div>
                                <textarea
                                    value={ratingComment}
                                    onChange={(event) => setRatingComment(event.target.value)}
                                    disabled={!canRate || rateMutation.isPending}
                                    placeholder="Optional rating comment"
                                    className="mt-3 min-h-20 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <Button
                                    type="button"
                                    className="mt-3"
                                    onClick={() => rateMutation.mutate()}
                                    disabled={!canRate || rateMutation.isPending}
                                >
                                    {rateMutation.isPending ? 'Saving...' : 'Save rating'}
                                </Button>
                            </div>
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-semibold">Comments</h3>
                                <span className="text-xs text-muted-foreground">
                                    {item.comments_count} comments
                                </span>
                            </div>
                            <CommentSection2
                                targetType="shop"
                                targetId={item.id}
                                artistUsername={item.artist?.username}
                                compact
                            />
                        </div>
                    </aside>
                </div>
            </DialogContent>
        </Dialog>
    )
}
