import { storageUrl } from "@/utils/storage"
import type { ShopDownload } from "./types"

export function ArtistAvatar({
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
