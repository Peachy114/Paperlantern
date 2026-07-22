import { useQuery } from '@tanstack/react-query'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import type { PageLayout } from '@/types/pageLayout'
import type { CommissionService, CommissionsResponse } from '@/types/commission'

export interface CommissionCategory {
    id: string
    name: string
    slug: string
    commissions_count?: number
}

export interface CommissionExploreResponse extends CommissionsResponse {
    commissions: {
        data: CommissionService[]
        current_page?: number
        last_page?: number
        per_page?: number
        total?: number
    }
    categories: CommissionCategory[]
    layout?: PageLayout
}

export interface UseCommissionsOptions {
    params?: URLSearchParams
    enabled?: boolean
    staleTime?: number
}

function toArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value
    }

    if (
        value &&
        typeof value === 'object' &&
        'data' in value &&
        Array.isArray((value as { data?: unknown }).data)
    ) {
        return (value as { data: T[] }).data
    }

    return []
}

export function useCommissions(options: UseCommissionsOptions = {}) {
    const { params, enabled = true, staleTime = 60_000 } = options

    const queryString = params?.toString() ?? ''

    const query = useQuery<CommissionExploreResponse>({
        queryKey: ['public-commissions', queryString],

        enabled,

        queryFn: async () => {
            const response = await publicApi.getCommissions(params)

            console.log('getCommissions response:', response)
            console.log('getCommissions data:', response.data)
            console.log('getCommissions items:', response.data?.commissions?.data)

            return response.data
        },

        staleTime,

        refetchOnMount: 'always',
    })

    const commissions = toArray<CommissionService>(query.data?.commissions)

    const boostedCommissions = commissions.filter((commission) => Boolean(commission.boosted_until))

    const openCommissions = commissions.filter((commission) => commission.status === 'open')

    const waitlistCommissions = commissions.filter((commission) => commission.status === 'waitlist')

    const closedCommissions = commissions.filter((commission) => commission.status === 'closed')

    const image = (path?: string | null, variant?: 'sm'): string | null => {
        return path ? storageUrl(path, variant) : null
    }

    const commissionImage = (commission: CommissionService, variant?: 'sm'): string | null => {
        const path = commission.image_path ?? commission.artist?.avatar ?? null

        return image(path, variant)
    }

    return {
        commissions,
        boostedCommissions,
        openCommissions,
        waitlistCommissions,
        closedCommissions,

        categories: query.data?.categories ?? [],
        layout: query.data?.layout,

        pagination: {
            currentPage: query.data?.commissions?.current_page ?? 1,
            lastPage: query.data?.commissions?.last_page ?? 1,
            perPage: query.data?.commissions?.per_page ?? commissions.length,
            total: query.data?.commissions?.total ?? commissions.length,
        },

        image,
        commissionImage,

        data: query.data,
        error: query.error,

        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isSuccess: query.isSuccess,
        isError: query.isError,

        refetch: query.refetch,
    }
}
