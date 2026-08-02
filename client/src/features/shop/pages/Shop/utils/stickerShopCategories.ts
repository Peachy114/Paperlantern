import type { ShopSticker } from "../types"

export function stickerShopCategories(items: ShopSticker[]) {
    const categories = new Set<string>()
    const usageLabels: Record<keyof ShopSticker['usage'], string> = {
        stickers: 'Stickers',
        backgrounds: 'Backgrounds',
        comments: 'Comments',
        profile: 'Profile',
        messages: 'Messages',
    }

    if (items.length > 0) {
        categories.add('Stickers')
    }

    items.forEach((item) => {
        Object.entries(item.usage).forEach(([key, value]) => {
            if (value) categories.add(usageLabels[key as keyof ShopSticker['usage']] ?? key)
        })
    })

    const preferredOrder = ['Stickers', 'Backgrounds', 'Comments', 'Profile', 'Messages']

    return Array.from(categories).sort((a, b) => {
        const aOrder = preferredOrder.indexOf(a)
        const bOrder = preferredOrder.indexOf(b)
        if (aOrder !== -1 || bOrder !== -1) {
            return (aOrder === -1 ? 999 : aOrder) - (bOrder === -1 ? 999 : bOrder)
        }

        return a.localeCompare(b)
    })
}
