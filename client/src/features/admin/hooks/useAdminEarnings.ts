import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'

export interface AdminEarnings {
    total_credits_spent: number
    total_platform_credits: number
    total_storyteller_credits: number
    total_platform_php: number
    total_storyteller_php: number
    total_transactions: number
    pending_withdrawals_count: number
    pending_withdrawals_php: number
}

export function useAdminEarnings() {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-earnings'],
        queryFn: async () => {
            const { data } = await api.get<AdminEarnings>('/admin/earnings')
            return data
        },
        staleTime: 1000 * 60,
    })

    return { earnings: data ?? null, isLoading }
}
