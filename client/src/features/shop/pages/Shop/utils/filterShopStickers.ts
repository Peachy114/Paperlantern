import type { ShopSticker } from "../types"

export function filterShopStickers(items: ShopSticker[], category: string) {
    if (category === 'all') return items

    return items.filter((item) => {
        const usageKey = category.toLowerCase() as keyof ShopSticker['usage']
        return Boolean(item.usage[usageKey])
    })
}
