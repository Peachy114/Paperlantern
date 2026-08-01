import { storageUrl } from "@/utils/storage"
import { ShoppingBag, Star } from "lucide-react"
import { ArtistAvatar } from "./ArtistAvatar"
// import { SourceBadge } from "./SourceBadge"
import type { ShopDownload } from "./types"
import { isNewItem } from "./utils/isNewItem"
import { shopProductPrice } from "./utils/shopProductPrice"

export function ShopProductCard({
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
                    {/* <SourceBadge source={item.source} label={item.source_label} /> */}
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