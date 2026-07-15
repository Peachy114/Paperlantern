import api from '@/api/axios'
import { type WalletTransaction } from '@/types/wallet'

// ─── Shared ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
}

// ─── Wallet (Wanderer) ─────────────────────────────────────────────────────

export interface WalletBalance {
    balance: number
}

export const getWalletBalance = (): Promise<WalletBalance> => api.get('/wallet').then((r) => r.data)

export const getWalletTransactions = (
    page = 1,
    perPage = 15
): Promise<PaginatedResponse<WalletTransaction>> =>
    api.get('/wallet/transactions', { params: { page, per_page: perPage } }).then((r) => r.data)

// ─── Earnings (Storyteller) ────────────────────────────────────────────────

export interface EarningsSummary {
    balance_credits: number
    balance_php: number
    withdrawable_credits?: number
    withdrawable_php?: number
    min_withdrawal: number
    min_withdrawal_credits: number
    can_withdraw: boolean
    has_minimum_balance?: boolean
    payout_day?: string
    is_payout_day?: boolean
    next_payout_at?: string
    payout_notice?: string
    latest_withdrawal: {
        status: 'pending' | 'approved' | 'paid' | 'rejected'
        amount_php: number
        payout_method: 'gcash' | 'maya' | 'bank'
        admin_notes: string | null
        processed_at: string | null
        created_at: string
    } | null
}

export interface EarningTransaction {
    id: string
    source?: string
    storyteller_cut: number
    storyteller_php: number
    credits_spent: number
    platform_cut: number
    platform_php: number
    balance_after?: number
    created_at: string
    chapter?: { id: string; title: string }
    earnable?: {
        id: string
        title?: string | null
        body?: string | null
        name?: string | null
        service?: { id: string; title: string } | null
        work?: { id: string; title: string } | null
    } | null
    reader?: { id: string; name: string }
}

export interface PaymentSettings {
    gcash: {
        account_name: string
        account_number: string
    }
    maya: {
        account_name: string
        account_number: string
    }
}

export interface WithdrawalTransaction {
    id: string
    amount_php: number
    credits_redeemed: number
    balance_after?: number
    payout_method: 'gcash' | 'maya' | 'bank'
    payout_details: string
    status: 'pending' | 'approved' | 'paid' | 'rejected'
    admin_notes: string | null
    processed_at: string | null
    created_at: string
}

export const getEarningsSummary = (): Promise<EarningsSummary> =>
    api.get('/studio/earnings').then((r) => r.data)

export const getAccountEarningsSummary = (): Promise<EarningsSummary> =>
    api.get('/account/earnings').then((r) => r.data)

export const getEarningsHistory = (
    page = 1,
    perPage = 15
): Promise<PaginatedResponse<EarningTransaction>> =>
    api.get('/studio/earnings/history', { params: { page, per_page: perPage } }).then((r) => r.data)

export const getAccountEarningsHistory = (
    page = 1,
    perPage = 15
): Promise<PaginatedResponse<EarningTransaction>> =>
    api.get('/account/earnings/history', { params: { page, per_page: perPage } }).then((r) => r.data)

export const getAccountWithdrawalHistory = (
    page = 1,
    perPage = 15
): Promise<PaginatedResponse<WithdrawalTransaction>> =>
    api
        .get('/account/earnings/withdrawals', { params: { page, per_page: perPage } })
        .then((r) => r.data)

export async function requestAccountWithdrawal(payload: {
    amount_php: number
    payout_method: 'gcash' | 'maya' | 'bank'
    payout_details: string
}): Promise<{ success: boolean; message: string }> {
    try {
        const { data } = await api.post('/account/earnings/withdraw', payload)
        return data
    } catch (err: any) {
        return {
            success: false,
            message: err.response?.data?.message ?? 'Something went wrong.',
        }
    }
}

export const getPaymentSettings = (): Promise<{ payment_settings: PaymentSettings }> =>
    api.get('/payment-settings').then((r) => r.data)

export const updatePaymentSettings = (
    payment_settings: PaymentSettings
): Promise<{ message: string; payment_settings: PaymentSettings }> =>
    api.put('/payment-settings', payment_settings).then((r) => r.data)

export const getWithdrawalHistory = (
    page = 1,
    perPage = 15
): Promise<PaginatedResponse<WithdrawalTransaction>> =>
    api
        .get('/studio/earnings/withdrawals', { params: { page, per_page: perPage } })
        .then((r) => r.data)
