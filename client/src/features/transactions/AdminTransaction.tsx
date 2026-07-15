import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, Coins } from 'lucide-react'
import api from '@/api/axios'
import { TransactionSummary } from '@/features/transactions/components/TransactionSummary'
import { TransactionTable } from '@/features/transactions/components/TransactionTable'
import type { Transaction, TransactionStatus } from '@/types/transaction'

interface AdminLedgerRow {
    id: string
    created_at: string
    direction: 'income' | 'expense'
    source: string
    description: string
    credits: number
    current_credits: number | null
    php_amount: number | null
    status: TransactionStatus
    user?: {
        name: string
        email: string
        role: string
    } | null
    counterparty?: {
        name: string
        email: string
        role: string
    } | null
}

interface AdminLedgerResponse {
    summary: {
        income_credits: number
        expense_credits: number
        income_php: number
        expense_php: number
        income_count: number
        expense_count: number
    }
    all: AdminLedgerRow[]
    income: AdminLedgerRow[]
    expense: AdminLedgerRow[]
}

const EMPTY_SUMMARY: AdminLedgerResponse['summary'] = {
    income_credits: 0,
    expense_credits: 0,
    income_php: 0,
    expense_php: 0,
    income_count: 0,
    expense_count: 0,
}

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

function signedCredits(value: number, isIncome: boolean): string {
    return `${isIncome ? '+' : '-'}${formatCredits(value)}`
}

function signedPhp(value: number, isIncome: boolean): string {
    return `${isIncome ? '+' : '-'}PHP ${Number(value ?? 0).toFixed(2)}`
}

function rowToTransaction(row: AdminLedgerRow): Transaction {
    const actor = row.user ? ` (${row.user.name})` : ''
    const counterparty = row.counterparty ? ` -> ${row.counterparty.name}` : ''
    const isIncome = row.direction === 'income'
    const credits = signedCredits(Number(row.credits ?? 0), isIncome)

    return {
        id: row.id,
        date: formatDate(row.created_at),
        sortAt: row.created_at,
        description: `${sourceLabel(row.source)} - ${row.description}${actor}${counterparty}`,
        amount: row.php_amount === null ? `${credits} credits` : signedPhp(Number(row.php_amount), isIncome),
        credits,
        balance: row.current_credits === null ? undefined : formatCredits(Number(row.current_credits)),
        status: row.status,
    }
}

export default function AdminTransaction() {
    const [summary, setSummary] = useState(EMPTY_SUMMARY)
    const [expense, setExpense] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                setLoading(true)
                setError(null)

                const { data } = await api.get<AdminLedgerResponse>('/admin/transactions', {
                    params: { per_page: 250 },
                })

                if (cancelled) return

                setSummary(data.summary)
                setExpense(data.expense.map(rowToTransaction).sort(latestFirst))
            } catch (err) {
                if (!cancelled) setError('Failed to load platform transactions. Please try again.')
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
            { icon: Coins, label: 'Net credits', value: formatCredits(summary.income_credits - summary.expense_credits) },
            { icon: ArrowDownCircle, label: 'Expense', value: `${summary.expense_count} records` },
        ],
        [summary]
    )

    return (
        <div className="mx-auto max-w-5xl px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Platform expense history from refunds, payouts, and outgoing credit movements.
                </p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <TransactionSummary items={summaryItems} loading={loading} />

            <TransactionTable
                rows={expense}
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
