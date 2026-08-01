import type { HeroItem } from "../types"

export function uniqueHeroItems(items: HeroItem[]) {
    const seen = new Set<string>()

    return items.filter((item) => {
        const key = `${item.type}-${item.href || item.id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}