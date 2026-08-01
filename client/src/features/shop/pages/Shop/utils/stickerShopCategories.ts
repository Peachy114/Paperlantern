import type { ShopSticker } from "../types"

export function stickerShopCategories(items: ShopSticker[]) {
    const categories = new Set<string>()
    items.forEach((item) => {
        if (item.source_label) categories.add(item.source_label)
        if (item.bundle_name) categories.add(item.bundle_name)
        Object.entries(item.usage).forEach(([key, value]) => {
            if (value) categories.add(key.charAt(0).toUpperCase() + key.slice(1))
        })
    })

    return Array.from(categories).sort((a, b) => a.localeCompare(b))
}
