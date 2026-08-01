import { toast } from "sonner"
import type { ShopDownload } from "../types"

export async function shareShopItem(item: ShopDownload) {
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
