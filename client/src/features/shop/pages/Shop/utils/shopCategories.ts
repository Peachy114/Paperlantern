import type { ShopDownload } from "../types"

export function shopCategories(items: ShopDownload[]) {
    const categories = new Set<string>()
    items.forEach((item) => {
        item.labels.forEach((label) => categories.add(label))
        if (item.source_label) categories.add(item.source_label)
    })

    return Array.from(categories).sort((a, b) => a.localeCompare(b))
}