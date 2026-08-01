import type { ShopDownload } from "../types"

export function filterShopDownloads(items: ShopDownload[], category: string) {
    if (category === 'all') return items

    return items.filter((item) => item.labels.includes(category) || item.source_label === category)
}
