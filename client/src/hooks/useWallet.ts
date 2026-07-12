import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'
import type {
    Wallet,
    CreditPackage,
    CreditPayment,
    CreditPaymentResponse,
    CreditPaymentStatus,
    WalletTransaction,
    CheckoutResponse,
    UnlockResponse,
} from '@/types/wallet'

// ── Wallet ────────────────────────────────────────────────────────────────────
export function useWallet() {
    const { token } = useAuthStore()

    const {
        data: wallet,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const { data } = await api.get<Wallet>('/wallet')
            return data
        },
        enabled: !!token, // only fetch when logged in
        staleTime: 1000 * 30, // 30 seconds
    })

    const queryClient = useQueryClient()
    const refetch = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['wallet'] })
    }, [queryClient])

    return { wallet: wallet ?? null, loading: isLoading, error, refetch }
}

// ── Credit Packages ───────────────────────────────────────────────────────────
export function useCreditPackages() {
    const { token } = useAuthStore()
    const { data: packages = [], isLoading } = useQuery({
        queryKey: ['credit-packages'],
        queryFn: async () => {
            const { data } = await api.get<{ packages: CreditPackage[] } | CreditPackage[]>(
                '/credits/packages'
            )
            return Array.isArray(data) ? data : (data.packages ?? [])
        },
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
    })

    return { packages, loading: isLoading }
}

// ── Wallet Transactions ───────────────────────────────────────────────────────
export function useWalletTransactions(perPage = 15) {
    const { token } = useAuthStore()

    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['wallet-transactions', perPage],
        queryFn: async () => {
            const { data } = await api.get<{ data: WalletTransaction[] }>(
                `/wallet/transactions?per_page=${perPage}`
            )
            return data.data
        },
        enabled: !!token,
        staleTime: 1000 * 30,
    })

    return { transactions, loading: isLoading }
}

// ── Actions ───────────────────────────────────────────────────────────────────
export async function initiateCheckout(packageId: string): Promise<CheckoutResponse> {
    const { data } = await api.post<CheckoutResponse>('/credits/checkout', {
        package_id: packageId,
    })
    return data
}

export async function getCreditPayment(paymentId: string): Promise<CreditPayment> {
    const { data } = await api.get<CreditPayment>(`/credits/payments/${paymentId}`)
    return data
}

export async function simulateCreditPayment(
    paymentId: string,
    status: CreditPaymentStatus | 'success'
): Promise<CreditPaymentResponse> {
    const { data } = await api.post<CreditPaymentResponse>(
        `/credits/payments/${paymentId}/simulate`,
        { status }
    )
    return data
}

export async function unlockChapter(chapterSlug: string): Promise<UnlockResponse> {
    try {
        const { data } = await api.post<UnlockResponse>(`/chapters/${chapterSlug}/unlock`)
        return data
    } catch (err: any) {
        if (err.response?.status === 402) {
            return err.response.data as UnlockResponse
        }
        throw err
    }
}
