import type { ShopDownload } from "../types"

export function isNewItem(item: ShopDownload) {
    if (!item.created_at) return false

    const createdAt = new Date(item.created_at).getTime()
    if (Number.isNaN(createdAt)) return false

    return Date.now() - createdAt <= 30 * 24 * 60 * 60 * 1000
}