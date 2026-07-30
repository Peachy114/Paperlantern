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
    created_at?: string
    source?: 'admin' | 'artist'
    source_label?: string
    artist?: {
        name: string
        username: string
        avatar?: string | null
    } | null
}

export default function ShopCardWidget({
    widget,
    preview = false,
}: {
    widget: PageWidget
    preview?: boolean
}) {
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
    const sourceItems = (shop.data?.downloads?.data ?? []) as ShopWidgetItem[]
    const items = filterShopItems(
        sourceItems.length === 0 && preview ? sampleShopItems() : sourceItems,
        widget
    ).slice(0, limit)

    if (shop.isLoading) {
        return <ShopCardSkeleton count={limit} columns={widget.settings.columns} />
    }

    if (items.length === 0) return null

    return (
        <section className="mx-auto my-5 w-full max-w-[1480px] px-5">
            <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{widget.title || 'Shop Picks'}</h2>
                <a
                    href="/shop"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
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

const SAMPLE_SHOP_ITEMS: ShopWidgetItem[] = [
    {
        id: 'sample-shop-1',
        title: 'Sample Digital Pack',
        labels: ['Digital', 'By Artist'],
        image_path: sampleShopImage('Shop'),
        download_policy: 'paid',
        credit_cost: 12,
        files_count: 3,
        downloads_count: 48,
        likes: 120,
        created_at: '2026-07-28T10:00:00.000Z',
        source: 'artist',
        source_label: 'By Artist',
        artist: {
            name: 'Preview Artist',
            username: 'preview_artist',
            avatar: sampleShopImage('A'),
        },
    },
    {
        id: 'sample-shop-2',
        title: 'Sample Admin Asset',
        labels: ['Official', 'By Admin'],
        image_path: sampleShopImage('Admin', '#0ea5e9', '#111827'),
        download_policy: 'free',
        credit_cost: 0,
        files_count: 1,
        downloads_count: 96,
        likes: 210,
        created_at: '2026-07-28T10:00:00.000Z',
        source: 'admin',
        source_label: 'By Admin',
        artist: null,
    },
]

function sampleShopItems() {
    if (SAMPLE_SHOP_ITEMS.length >= 10) return SAMPLE_SHOP_ITEMS

    return Array.from({ length: 10 }, (_, index) => {
        const source = SAMPLE_SHOP_ITEMS[index % SAMPLE_SHOP_ITEMS.length]
        const cycle = Math.floor(index / SAMPLE_SHOP_ITEMS.length) + 1

        return {
            ...source,
            id: index < SAMPLE_SHOP_ITEMS.length ? source.id : `${source.id}-preview-${cycle}`,
            title: index < SAMPLE_SHOP_ITEMS.length ? source.title : `${source.title} ${cycle}`,
            downloads_count: source.downloads_count + index * 7,
            likes: source.likes + index * 3,
        }
    })
}

function sampleShopImage(label: string, from = '#ff8a00', to = '#ff477e') {
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="640" height="480" rx="42" fill="url(#g)"/><text x="50%" y="50%" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="56" font-weight="800" fill="white">${label}</text><text x="50%" y="60%" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="24" fill="rgba(255,255,255,.8)">Preview item</text></svg>`
    )}`
}

function filterShopItems(items: ShopWidgetItem[], widget: PageWidget) {
    const settings = widget.settings
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = (settings.label_filter_values ?? [])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()

    const filtered = items.filter((item) => {
        if (!matchesDateWindow(item.created_at, widget)) return false

        const matches = (source: string, value: string) => {
            if (!value || source === 'none') return true
            if (source === 'label' || source === 'genre') {
                return item.labels.some((label) => label.toLowerCase() === value)
            }
            if (source === 'source') {
                return (
                    item.source_label?.toLowerCase() === value ||
                    item.source?.toLowerCase() === value
                )
            }
            if (source === 'artist') {
                return (
                    item.artist?.name.toLowerCase() === value ||
                    item.artist?.username.toLowerCase() === value
                )
            }
            if (source === 'status') {
                return (
                    item.download_policy.toLowerCase() === value ||
                    item.source?.toLowerCase() === value
                )
            }
            return source !== 'commission_type'
        }

        const multiOk =
            multiSource === 'none' || multiValues.length === 0
                ? true
                : multiValues.some((value) => matches(multiSource, value))
        const badgeOk =
            badgeSource === 'none' || !badgeValue ? true : matches(badgeSource, badgeValue)

        return multiOk && badgeOk
    })

    return sortShopItems(filtered, widget)
}

function sortShopItems(items: ShopWidgetItem[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'popular', 'latest']

    return [...items].sort((a, b) => {
        for (const sort of sorts) {
            const value = compareShopSort(a, b, sort)
            if (value !== 0) return value
        }

        return 0
    })
}

function compareShopSort(a: ShopWidgetItem, b: ShopWidgetItem, sort: string) {
    if (sort === 'likes') return b.likes - a.likes
    if (sort === 'views' || sort === 'popular') return b.downloads_count - a.downloads_count
    if (sort === 'new' || sort === 'latest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    }
    return 0
}

function matchesDateWindow(value: string | undefined, widget: PageWidget) {
    const mode = widget.settings.date_mode ?? 'all'
    const dateValue = widget.settings.date_value || widget.settings.daily_date
    if (mode === 'all' || !value) return true

    const date = new Date(value)
    const base = dateValue ? new Date(dateValue) : new Date()
    if (Number.isNaN(date.getTime()) || Number.isNaN(base.getTime())) return true

    if (mode === 'daily') return date.toISOString().slice(0, 10) === base.toISOString().slice(0, 10)
    if (mode === 'weekly')
        return Math.abs(date.getTime() - base.getTime()) <= 7 * 24 * 60 * 60 * 1000
    if (mode === 'monthly') {
        return (
            date.getUTCFullYear() === base.getUTCFullYear() &&
            date.getUTCMonth() === base.getUTCMonth()
        )
    }

    return true
}

function ShopCardSkeleton({ count, columns }: { count: number; columns?: number }) {
    return (
        <section className="mx-auto my-5 w-full max-w-[1480px] px-5">
            <div className="mb-5 h-8 w-44 animate-pulse rounded bg-muted" />
            <div
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                style={
                    columns
                        ? {
                              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                          }
                        : undefined
                }
            >
                {Array.from({ length: Math.max(1, Math.min(count, 10)) }).map((_, index) => (
                    <div
                        key={index}
                        className="rounded-[28px] bg-background p-4 shadow-[0_18px_42px_rgba(15,23,42,0.12)] ring-1 ring-foreground/10"
                    >
                        <div className="aspect-[4/3] animate-pulse rounded-[22px] bg-muted" />
                        <div className="mt-4 flex items-center gap-3">
                            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                            </div>
                        </div>
                        <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-muted" />
                        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
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
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                            item.source === 'admin'
                                ? 'bg-sky-500 text-white'
                                : 'bg-background text-orange-500'
                        }`}
                    >
                        {item.source_label ?? (item.source === 'admin' ? 'By Admin' : 'By Artist')}
                    </span>
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
