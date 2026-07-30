import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Palette, Sparkles, UserRound } from 'lucide-react'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import type { PageWidget } from '@/types/pageLayout'

type StickerShopItem = {
    id: string
    name: string
    bundle_name?: string | null
    image_path: string | null
    is_free: boolean
    credit_cost: number
    source?: 'admin' | 'artist'
    source_label?: string
    artist?: { name: string; username: string; avatar?: string | null } | null
    usage?: {
        comments?: boolean
        profile?: boolean
        backgrounds?: boolean
        messages?: boolean
    }
}

export default function StickerShopWidget({
    widget,
    preview = false,
}: {
    widget: PageWidget
    preview?: boolean
}) {
    const limit = widget.settings.limit ?? 10
    const shop = useQuery({
        queryKey: ['public-shop-sticker-widget', limit],
        queryFn: () => {
            const params = new URLSearchParams()
            params.set('limit', String(limit))
            return publicApi.getShop(params).then((res) => res.data)
        },
        staleTime: 60_000,
    })
    const sourceItems = (shop.data?.stickers ?? []) as StickerShopItem[]
    const items = filterStickerItems(
        sourceItems.length === 0 && preview ? sampleStickerItems() : sourceItems,
        widget
    ).slice(0, limit)

    if (shop.isLoading) {
        return <StickerShopSkeleton count={limit} columns={widget.settings.columns} />
    }

    if (items.length === 0) return null

    return (
        <section className="mx-auto my-5 w-full max-w-[1480px] px-5">
            <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{widget.title || 'Sticker Shop'}</h2>
                <a
                    href="/shop"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                    View all
                </a>
            </div>
            <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
                style={
                    widget.settings.columns
                        ? {
                              gridTemplateColumns: `repeat(${widget.settings.columns}, minmax(0, 1fr))`,
                          }
                        : undefined
                }
            >
                {items.map((item, index) => (
                    <StickerCard key={item.id} item={item} index={index} widget={widget} />
                ))}
            </div>
        </section>
    )
}

const SAMPLE_STICKER_ITEMS: StickerShopItem[] = [
    {
        id: 'sample-sticker-1',
        name: 'Sample Cheer',
        bundle_name: 'Preview Pack',
        image_path: sampleStickerImage('Cheer', '#56b6ff', '#facc15'),
        is_free: true,
        credit_cost: 0,
        source: 'admin',
        source_label: 'By Admin',
        artist: null,
        usage: {
            comments: true,
            profile: true,
            backgrounds: false,
            messages: true,
        },
    },
    {
        id: 'sample-sticker-2',
        name: 'Sample Spark',
        bundle_name: 'Artist Pack',
        image_path: sampleStickerImage('Spark', '#fb7185', '#8b5cf6'),
        is_free: false,
        credit_cost: 5,
        source: 'artist',
        source_label: 'By Artist',
        artist: { name: 'Preview Artist', username: 'preview_artist' },
        usage: {
            comments: true,
            profile: true,
            backgrounds: true,
            messages: true,
        },
    },
]

function sampleStickerItems() {
    if (SAMPLE_STICKER_ITEMS.length >= 10) return SAMPLE_STICKER_ITEMS

    return Array.from({ length: 10 }, (_, index) => {
        const source = SAMPLE_STICKER_ITEMS[index % SAMPLE_STICKER_ITEMS.length]
        const cycle = Math.floor(index / SAMPLE_STICKER_ITEMS.length) + 1

        return {
            ...source,
            id: index < SAMPLE_STICKER_ITEMS.length ? source.id : `${source.id}-preview-${cycle}`,
            name: index < SAMPLE_STICKER_ITEMS.length ? source.name : `${source.name} ${cycle}`,
        }
    })
}

function sampleStickerImage(label: string, from: string, to: string) {
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><circle cx="180" cy="180" r="150" fill="url(#g)"/><circle cx="135" cy="145" r="18" fill="white"/><circle cx="225" cy="145" r="18" fill="white"/><path d="M125 220c34 28 76 28 110 0" fill="none" stroke="white" stroke-width="18" stroke-linecap="round"/><text x="50%" y="312" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="28" font-weight="800" fill="white">${label}</text></svg>`
    )}`
}

function filterStickerItems(items: StickerShopItem[], widget: PageWidget) {
    const settings = widget.settings
    const multiSource = settings.label_filter_source ?? 'none'
    const multiValues = (settings.label_filter_values ?? [])
        .map((value) => value.toLowerCase())
        .filter(Boolean)
    const badgeSource = settings.badge_filter_source ?? 'none'
    const badgeValue = String(settings.badge_filter_value ?? '').toLowerCase()

    const filtered = items.filter((item) => {
        if (!matchesDateWindow(undefined, widget)) return false

        const matches = (source: string, value: string) => {
            if (!value || source === 'none') return true
            if (source === 'source' || source === 'status') {
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
            if (source === 'label' || source === 'genre') {
                return String(item.bundle_name ?? '').toLowerCase() === value
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

    return sortStickerItems(filtered, widget)
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

function sortStickerItems(items: StickerShopItem[], widget: PageWidget) {
    const sorts = widget.settings.sort_order?.length
        ? widget.settings.sort_order
        : ['featured', 'latest']

    return [...items].sort((a, b) => {
        for (const sort of sorts) {
            const value = compareStickerSort(a, b, sort)
            if (value !== 0) return value
        }

        return 0
    })
}

function compareStickerSort(a: StickerShopItem, b: StickerShopItem, sort: string) {
    if (sort === 'featured') return Number(b.source === 'admin') - Number(a.source === 'admin')
    if (sort === 'popular' || sort === 'views' || sort === 'likes') {
        return Number(!b.is_free) - Number(!a.is_free)
    }
    return a.name.localeCompare(b.name)
}

function StickerShopSkeleton({ count, columns }: { count: number; columns?: number }) {
    return (
        <section className="mx-auto my-5 w-full max-w-[1480px] px-5">
            <div className="mb-5 h-8 w-44 animate-pulse rounded bg-muted" />
            <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
                style={
                    columns
                        ? {
                              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                          }
                        : undefined
                }
            >
                {Array.from({ length: Math.max(1, Math.min(count, 12)) }).map((_, index) => (
                    <div key={index} className="rounded-lg border bg-background p-3">
                        <div className="aspect-square animate-pulse rounded-md bg-muted" />
                        <div className="mt-3 h-4 w-24 animate-pulse rounded bg-muted" />
                        <div className="mt-2 h-3 w-16 animate-pulse rounded bg-muted" />
                    </div>
                ))}
            </div>
        </section>
    )
}

function StickerCard({
    item,
    index,
    widget,
}: {
    item: StickerShopItem
    index: number
    widget: PageWidget
}) {
    const settings = widget.settings

    return (
        <a
            href="/shop"
            className="group rounded-lg border bg-background p-3 transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="relative flex aspect-square items-center justify-center rounded-md bg-muted/40">
                {item.image_path ? (
                    <img
                        src={storageUrl(item.image_path)!}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                )}
                {settings.card_show_rank !== false && index < 10 ? (
                    <span className="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        {index + 1}
                    </span>
                ) : null}
            </div>
            {settings.card_show_name !== false ? (
                <h3 className="mt-3 truncate text-sm font-semibold">{item.name}</h3>
            ) : null}
            {settings.card_show_artist !== false ? (
                <p className="truncate text-xs text-muted-foreground">
                    {item.bundle_name || `@${item.artist?.username ?? 'artist'}`}
                </p>
            ) : null}
            {settings.card_show_labels !== false ? (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.source_label ?? (item.source === 'admin' ? 'By Admin' : 'By Artist')}
                </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1 text-muted-foreground">
                {item.usage?.comments !== false ? <MessageCircle className="h-3.5 w-3.5" /> : null}
                {item.usage?.profile !== false ? <UserRound className="h-3.5 w-3.5" /> : null}
                {item.usage?.backgrounds !== false ? <Palette className="h-3.5 w-3.5" /> : null}
                {item.usage?.messages !== false ? <Sparkles className="h-3.5 w-3.5" /> : null}
            </div>
            {settings.card_show_price !== false ? (
                <div className="mt-2 text-xs font-semibold">
                    {item.is_free ? 'Free' : `${item.credit_cost} credits`}
                </div>
            ) : null}
        </a>
    )
}
