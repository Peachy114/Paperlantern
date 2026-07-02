import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransactionTable } from '@/features/transactions/components/TransactionTable'
import { TransactionSummary } from '@/features/transactions/components/TransactionSummary'
import { TrendingUp, ArrowDownToLine } from 'lucide-react'
import {
    getEarningsSummary,
    getEarningsHistory,
    getWithdrawalHistory,
    type EarningTransaction,
    type WithdrawalTransaction,
} from '@/api/wallet'
import type { Transaction, TransactionStatus } from '@/types/transaction'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

/**
 * EarningTransaction → TransactionTable row
 *
 * API fields used:
 *   chapter.title      → description
 *   storyteller_php    → credits column (PHP earned, e.g. "+₱0.58")
 *   storyteller_cut    → shown in tooltip / ignored in table
 *   created_at         → date
 */
function earningToRow(tx: EarningTransaction): Transaction {
    return {
        id: tx.id,
        date: formatDate(tx.created_at),
        description: `Chapter unlock — ${tx.chapter?.title ?? 'Unknown chapter'}`,
        amount: '—',
        credits: `+₱${parseFloat(tx.storyteller_php as any).toFixed(2)}`,
        status: 'success' as TransactionStatus,
    }
}
/**
 * WithdrawalTransaction → TransactionTable row
 *
 * API fields used:
 *   amount_php     → amount + credits columns
 *   payout_method  → description
 *   payout_details → description (masked last 4 already from backend)
 *   status         → badge
 *   created_at     → date
 */
function withdrawalToRow(tx: WithdrawalTransaction): Transaction {
    const methodLabel: Record<string, string> = {
        gcash: 'GCash',
        maya: 'Maya',
        bank: 'Bank Transfer',
    }

    // status mapping: backend uses pending/approved/paid/rejected
    const statusMap: Record<string, TransactionStatus> = {
        pending: 'pending',
        approved: 'pending', // still in-flight, show as pending
        paid: 'success',
        rejected: 'failed',
    }

    return {
        id: tx.id,
        date: formatDate(tx.created_at),
        description: `Withdrawal to ${methodLabel[tx.payout_method] ?? tx.payout_method} — ${tx.payout_details}`,
        amount: `₱${tx.amount_php.toFixed(2)}`,
        credits: `+₱${tx.amount_php.toFixed(2)}`,
        status: statusMap[tx.status] ?? 'pending',
    }
}

// ─── Summary state ───────────────────────────────────────────────────────────

interface SummaryState {
    totalEarned: string
    totalWithdrawn: string
    chaptersSold: number
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StorytellerTransaction() {
    const [earnings, setEarnings] = useState<Transaction[]>([])
    const [withdrawals, setWithdrawals] = useState<Transaction[]>([])
    const [summary, setSummary] = useState<SummaryState>({
        totalEarned: '₱0.00',
        totalWithdrawn: '₱0.00',
        chaptersSold: 0,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                setLoading(true)
                setError(null)

                const [summaryRes, earningsRes, withdrawalsRes] = await Promise.all([
                    getEarningsSummary(),
                    getEarningsHistory(1, 100),
                    getWithdrawalHistory(),
                ])

                if (cancelled) return

                // Total withdrawn = sum of paid withdrawals
                const paidWithdrawals = withdrawalsRes.data.filter(
                    (w: WithdrawalTransaction) => w.status === 'paid'
                )
                const totalWithdrawnPhp = paidWithdrawals.reduce(
                    (acc: number, w: WithdrawalTransaction) => acc + w.amount_php,
                    0
                )

                setEarnings(earningsRes.data.map(earningToRow))
                setWithdrawals(withdrawalsRes.data.map(withdrawalToRow))

                setSummary({
                    // php_balance is current remaining balance; total earned = balance + withdrawn
                    totalEarned: `₱${(summaryRes.balance_php + totalWithdrawnPhp).toFixed(2)}`,
                    totalWithdrawn: `₱${totalWithdrawnPhp.toFixed(2)}`,
                    chaptersSold: earningsRes.total,
                })
            } catch (err) {
                console.error('Load error:', err)
                if (!cancelled) setError('Failed to load earnings. Please try again.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="max-w-3xl mx-auto px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Your earnings from chapter unlocks and withdrawal history.
                </p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <TransactionSummary
                totalSpent={summary.totalEarned}
                creditsBalance={0}
                chaptersUnlocked={summary.chaptersSold}
                isStoryteller
                totalWithdrawn={summary.totalWithdrawn}
                loading={loading}
            />

            <Tabs defaultValue="earnings" className="mt-6">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="earnings" className="flex items-center gap-1.5 text-xs">
                        <TrendingUp className="w-3.5 h-3.5" /> Earnings
                    </TabsTrigger>
                    <TabsTrigger value="withdrawals" className="flex items-center gap-1.5 text-xs">
                        <ArrowDownToLine className="w-3.5 h-3.5" /> Withdrawals
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="earnings">
                    <TransactionTable
                        rows={earnings}
                        creditsLabel="Earned (PHP)"
                        hideAmount
                        loading={loading}
                    />
                </TabsContent>
                <TabsContent value="withdrawals">
                    <TransactionTable
                        rows={withdrawals}
                        creditsLabel="Received"
                        loading={loading}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
