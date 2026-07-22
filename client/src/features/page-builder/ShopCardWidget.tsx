import { useQuery } from '@tanstack/react-query'
import { Download, Heart, ShoppingBag, Star } from 'lucide-react'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import type { PageWidget } from '@/types/pageLayout'

type ShopWidgetItem = {
    id: string
    title: string
    labels: string[]
    image_path: string | null
    download_policy: 'free' | 'paid'
    credit_cost: number
    files_count: number
    downloads_count: number
    likes: number
    artist?: {
        name: string
        username: string
        avatar?: string | null
    } | null
}

export default function ShopCardWidget({ widget }: { widget: PageWidget }) {
    const limit = widget.settings.limit ?? 10
    const shop = useQuery({
        queryKey: ['public-shop-widget', limit],
        queryFn: () => {
            const params = new URLSearchParams()
            params.set('limit', String(limit))
            return publicApi.getShop(params).then((res) => res.data)
        },
        staleTime: 60_000,
    })
    const items = ((shop.data?.downloads?.data ?? []) as ShopWidgetItem[]).slice(0, limit)

    if (shop.isLoading) {
        return (
            <section className="mx-auto mt-10 w-full max-w-[1360px] px-5">
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                    Loading shop products...
                </div>
            </section>
        )
    }

    if (items.length === 0) return null

    return (
        <section className="mx-auto mt-10 w-full max-w-[1360px] px-5">
            <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{widget.title || 'Shop Picks'}</h2>
                <a href="/shop" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    View all
                </a>
            </div>
            <div
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                style={
                    widget.settings.columns
                        ? {
                              gridTemplateColumns: `repeat(${widget.settings.columns}, minmax(0, 1fr))`,
                          }
                        : undefined
                }
            >
                {items.map((item, index) => (
                    <ShopWidgetCard key={item.id} item={item} index={index} widget={widget} />
                ))}
            </div>
        </section>
    )
}

function ShopWidgetCard({
    item,
    index,
    widget,
}: {
    item: ShopWidgetItem
    index: number
    widget: PageWidget
}) {
    const settings = widget.settings
    const rank = index + 1

    return (
        <a
            href="/shop"
            className="group rounded-[28px] bg-background p-4 shadow-[0_18px_42px_rgba(15,23,42,0.12)] ring-1 ring-foreground/10 transition hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(15,23,42,0.16)]"
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
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {settings.card_show_popular !== false && rank <= 3 && (
                        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-orange-500 shadow-sm">
                            Popular
                        </span>
                    )}
                    {settings.card_show_new !== false && (
                        <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                            New
                        </span>
                    )}
                </div>
                {settings.card_show_rank !== false && (
                    <span className="absolute right-3 top-0 bg-red-500 px-3 py-4 text-lg font-bold text-white [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]">
                        {rank}
                    </span>
                )}
            </div>

            {settings.card_show_artist !== false && (
                <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-lg font-semibold text-white">
                        {item.artist?.avatar ? (
                            <img
                                src={storageUrl(item.artist.avatar)!}
                                alt={item.artist.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            (item.artist?.name ?? 'A').charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-orange-500">
                            {item.artist?.name ?? 'Creator'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            @{item.artist?.username ?? 'artist'}
                        </p>
                    </div>
                </div>
            )}

            {settings.card_show_name !== false && (
                <h3 className="mt-3 line-clamp-2 min-h-[2.75rem] text-base font-semibold text-muted-foreground">
                    {item.title}
                </h3>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {settings.card_show_price !== false && (
                    <span className="font-semibold text-foreground">
                        {item.download_policy === 'free' ? 'Free' : `${item.credit_cost} credits`}
                    </span>
                )}
                {settings.card_show_sold !== false && (
                    <span className="text-muted-foreground">{item.downloads_count} sold</span>
                )}
                {settings.card_show_rating !== false && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                        5.0
                    </span>
                )}
                {settings.card_show_likes !== false && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        {item.likes}
                    </span>
                )}
                {settings.card_show_views !== false && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Download className="h-4 w-4" />
                        {item.files_count}
                    </span>
                )}
            </div>

            {settings.card_show_labels !== false && item.labels.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {item.labels.slice(0, 3).map((label) => (
                        <span
                            key={label}
                            className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                            #{label}
                        </span>
                    ))}
                </div>
            )}
        </a>
    )
}
