export type TransactionStatus = 'success' | 'pending' | 'failed'

export interface Transaction {
    id: string
    date: string
    sortAt: string
    description: string
    amount: string
    credits: string
    balance?: string
    status: TransactionStatus
}
