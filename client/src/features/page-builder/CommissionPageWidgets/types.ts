import type { CommissionService } from '@/types/commission'

export type CommissionCategory = {
    id: string
    name: string
    slug: string
}

export interface CommissionWidgetData {
    commissions: CommissionService[]
    featuredCommissions?: CommissionService[]
    boostedCommissions?: CommissionService[]
    categories?: CommissionCategory[]
    activeCategory?: string
    onCategoryChange?: (value: string) => void
    isLoading: boolean
    onOpen: (commission: CommissionService) => void
}