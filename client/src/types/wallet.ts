export interface CreditPackage {
    id: string
    name: string
    credits: number
    price: number
    promo_label?: string | null
    promo_start_at?: string | null
    promo_end_at?: string | null
    is_active: boolean
    is_visible?: boolean
    sort_order: number
}

export interface WalletTransaction {
    id: string
    type: 'credit' | 'debit'
    source: string
    amount: number
    balance_before: number
    balance_after: number
    description: string
    created_at: string
}

export interface Wallet {
    balance: number
}

export interface CheckoutResponse {
    checkout_url: string
    reference_id: string
    payment_id: string
    payment_url: string
    status: CreditPaymentStatus
}

export type CreditPaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

export interface CreditPayment {
    id: string
    reference_id: string | null
    checkout_url: string | null
    status: CreditPaymentStatus
    currency: string
    amount: number
    credits: number
    description: string | null
    provider: string
    provider_mode: 'test' | 'live' | string
    can_simulate: boolean
    paid_at: string | null
    failed_at: string | null
    expired_at: string | null
    expires_at: string | null
    package: {
        id: string
        name: string
        credits: number
        price: number
    } | null
}

export interface CreditPaymentResponse {
    payment: CreditPayment
    wallet: Wallet
}

export interface UnlockResponse {
    success: boolean
    message: string
    balance: number
    requires_top_up?: boolean
    chapter?: { id: string; title: string }
}
