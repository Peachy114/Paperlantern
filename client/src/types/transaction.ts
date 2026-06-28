export type TransactionStatus = 'success' | 'pending' | 'failed'

export interface Transaction {
    id: string
    date: string
    description: string
    amount: string
    credits: string
    status: TransactionStatus
}
