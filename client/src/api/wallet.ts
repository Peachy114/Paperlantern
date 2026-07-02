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
    min_withdrawal: number
    can_withdraw: boolean
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
    storyteller_cut: number
    storyteller_php: number
    credits_spent: number
    platform_cut: number
    platform_php: number
    created_at: string
    chapter?: { id: string; title: string }
    reader?: { id: string; name: string }
}

export interface WithdrawalTransaction {
    id: string
    amount_php: number
    credits_redeemed: number
    payout_method: 'gcash' | 'maya' | 'bank'
    payout_details: string
    status: 'pending' | 'approved' | 'paid' | 'rejected'
    admin_notes: string | null
    processed_at: string | null
    created_at: string
}

export const getEarningsSummary = (): Promise<EarningsSummary> =>
    api.get('/studio/earnings').then((r) => r.data)

export const getEarningsHistory = (
    page = 1,
    perPage = 15
): Promise<PaginatedResponse<EarningTransaction>> =>
    api.get('/studio/earnings/history', { params: { page, per_page: perPage } }).then((r) => r.data)

export const getWithdrawalHistory = (
    page = 1,
    perPage = 15
): Promise<PaginatedResponse<WithdrawalTransaction>> =>
    api
        .get('/studio/earnings/withdrawals', { params: { page, per_page: perPage } })
        .then((r) => r.data)
