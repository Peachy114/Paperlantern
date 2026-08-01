import type { ShopDownload } from "../types"

export function shopProductPrice(item: ShopDownload) {
    if (item.download_policy === 'free') return 'Free'

    if (typeof item.price === 'number') {
        const currency = item.currency?.toUpperCase() ?? 'PHP'

        if (currency === 'PHP') {
            return `₱${item.price.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}+`
        }

        return `${item.price.toLocaleString()} ${currency}`
    }

    if (typeof item.price === 'string' && item.price.trim()) {
        return item.price.trim()
    }

    return `${item.credit_cost.toLocaleString()} credits`
}