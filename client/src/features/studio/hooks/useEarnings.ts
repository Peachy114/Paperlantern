// hooks/useEarnings.ts
import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'

export interface LatestWithdrawal {
    status: 'pending' | 'approved' | 'rejected' | 'paid'
    amount_php: number
    payout_method: 'gcash' | 'maya' | 'bank'
    admin_notes: string | null
    processed_at: string | null
    created_at: string
}

export interface Earnings {
    balance_credits: number
    balance_php: number
    min_withdrawal: number
    min_withdrawal_credits: number
    can_withdraw: boolean
    latest_withdrawal: LatestWithdrawal | null
}
export interface EarningTransaction {
    id: string
    chapter_id: number
    credits_spent: number
    platform_cut: number
    storyteller_cut: number
    platform_php: number
    storyteller_php: number
    created_at: string
    chapter?: { id: string; title: string }
    reader?: { id: string; name: string }
}

export function useEarnings() {
    const queryClient = useQueryClient()

    const { data: earnings, isLoading: loading } = useQuery({
        queryKey: ['earnings'],
        queryFn: async () => {
            const { data } = await api.get<Earnings>('/studio/earnings')
            return data
        },
        staleTime: 1000 * 30,
    })

    const refetch = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['earnings'] })
        queryClient.invalidateQueries({ queryKey: ['earnings-history'] })
    }, [queryClient])

    return { earnings: earnings ?? null, loading, refetch }
}

export function useEarningHistory(perPage = 10) {
    const [page, setPage] = useState(1)

    const { data, isLoading: loading } = useQuery({
        queryKey: ['earnings-history', perPage, page],
        queryFn: async () => {
            const { data } = await api.get<{
                data: EarningTransaction[]
                current_page: number
                last_page: number
                total: number
            }>(`/studio/earnings/history?per_page=${perPage}&page=${page}`)
            return data
        },
        staleTime: 1000 * 30,
    })

    return {
        history: data?.data ?? [],
        loading,
        page,
        setPage,
        lastPage: data?.last_page ?? 1,
        total: data?.total ?? 0,
    }
}

export async function requestWithdrawal(payload: {
    amount_php: number
    payout_method: 'gcash' | 'maya' | 'bank'
    payout_details: string
}): Promise<{ success: boolean; message: string }> {
    try {
        const { data } = await api.post('/studio/earnings/withdraw', payload)
        return data
    } catch (err: any) {
        return {
            success: false,
            message: err.response?.data?.message ?? 'Something went wrong.',
        }
    }
}
