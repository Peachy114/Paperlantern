import type { CommissionService } from '@/types/commission'

export function compareCommissionSort(a: CommissionService, b: CommissionService, sort: string) {
    if (sort === 'featured') return Number(b.is_featured) - Number(a.is_featured)
    if (sort === 'likes') return (b.likes_count ?? 0) - (a.likes_count ?? 0)
    if (sort === 'views' || sort === 'popular') {
        return (b.customers_count ?? 0) - (a.customers_count ?? 0)
    }
    if (sort === 'new' || sort === 'latest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    }
    return 0
}