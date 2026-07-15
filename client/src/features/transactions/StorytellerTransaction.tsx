import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, Coins } from 'lucide-react'
import { TransactionTable } from '@/features/transactions/components/TransactionTable'
import { TransactionSummary } from '@/features/transactions/components/TransactionSummary'
import { getWalletBalance, getWalletTransactions } from '@/api/wallet'
import type { WalletTransaction } from '@/types/wallet'
import type { Transaction, TransactionStatus } from '@/types/transaction'

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

function sourceLabel(source: string): string {
    return source
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

function formatCredits(value: number): string {
    return Number(value ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

function toExpenseRow(tx: WalletTransaction): Transaction {
    const credits = `-${formatCredits(tx.amount)}`

    return {
        id: `wallet-${tx.id}`,
        date: formatDate(tx.created_at),
        sortAt: tx.created_at,
        description: `${sourceLabel(tx.source)} - ${tx.description}`,
        amount: `${credits} credits`,
        credits,
        balance: formatCredits(tx.balance_after),
        status: 'success' as TransactionStatus,
    }
}

export default function StorytellerTransaction() {
    const [walletBalance, setWalletBalance] = useState(0)
    const [expenses, setExpenses] = useState<Transaction[]>([])
    const [expenseCredits, setExpenseCredits] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                setLoading(true)
                setError(null)

                const [walletRes, walletTxRes] = await Promise.all([
                    getWalletBalance(),
                    getWalletTransactions(1, 250),
                ])

                if (cancelled) return

                const expenseTx = walletTxRes.data.filter((tx) => tx.type === 'debit')
                const expenseRows = expenseTx.map(toExpenseRow).sort(latestFirst)

                setWalletBalance(walletRes.balance)
                setExpenses(expenseRows)
                setExpenseCredits(expenseTx.reduce((total, tx) => total + tx.amount, 0))
            } catch (err) {
                if (!cancelled) setError('Failed to load transaction history. Please try again.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()

        return () => {
            cancelled = true
        }
    }, [])

    const summaryItems = useMemo(
        () => [
            { icon: Coins, label: 'Wallet credits', value: formatCredits(walletBalance) },
            { icon: ArrowDownCircle, label: 'Expense credits', value: formatCredits(expenseCredits) },
        ],
        [expenseCredits, walletBalance]
    )

    return (
        <div className="mx-auto max-w-4xl px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Expense history for credits spent on boosts, downloads, chapters, commissions,
                    stickers, and Super Likes.
                </p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <TransactionSummary items={summaryItems} loading={loading} />
            <TransactionTable
                rows={expenses}
                creditsLabel="Credits out"
                loading={loading}
                pageSize={20}
            />
        </div>
    )
}

function latestFirst(a: Transaction, b: Transaction) {
    return new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
}
