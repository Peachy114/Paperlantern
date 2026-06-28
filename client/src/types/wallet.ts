export interface CreditPackage {
    id: string
    name: string
    credits: number
    price: number
    is_active: boolean
    sort_order: number
}

export interface WalletTransaction {
    id: string
    type: 'credit' | 'debit'
    source: 'purchase' | 'chapter_unlock' | 'refund' | 'bonus'
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
}

export interface UnlockResponse {
    success: boolean
    message: string
    balance: number
    requires_top_up?: boolean
    chapter?: { id: string; title: string }
}
