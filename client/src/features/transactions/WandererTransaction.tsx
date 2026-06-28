import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransactionTable } from '@/features/transactions/components/TransactionTable'
import { TransactionSummary } from '@/features/transactions/components/TransactionSummary'
import { Coins, BookOpen } from 'lucide-react'
import { getWalletBalance, getWalletTransactions } from '@/api/wallet'
import { type WalletTransaction } from '@/types/wallet'
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
 * Map a WalletTransaction from the API to the shape TransactionTable expects.
 *
 * WalletTransaction.type:   'credit' | 'debit'
 * WalletTransaction.source: 'purchase' | 'chapter_unlock'
 */
function toTableRow(tx: WalletTransaction): Transaction {
    const isCredit = tx.type === 'credit'
    return {
        id: tx.id,
        date: formatDate(tx.created_at),
        description: tx.description,
        // amount is only meaningful for purchases (credit type); chapter unlocks have no PHP cost
        amount: '—', // real amount not stored server-side here
        credits: isCredit ? `+${tx.amount}` : `-${tx.amount}`,
        status: 'success' as TransactionStatus, // WalletTransaction has no status field; all persisted = success
    }
}

// ─── Summary shape ───────────────────────────────────────────────────────────

interface SummaryState {
    creditsBalance: number
    chaptersUnlocked: number
    totalSpent: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WandererTransaction() {
    const [balance, setBalance] = useState<number>(0)
    const [purchases, setPurchases] = useState<Transaction[]>([])
    const [unlocks, setUnlocks] = useState<Transaction[]>([])
    const [summary, setSummary] = useState<SummaryState>({
        creditsBalance: 0,
        chaptersUnlocked: 0,
        totalSpent: '—',
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                setLoading(true)
                setError(null)

                // Fetch balance + full transaction list (page 1, 100 max to cover summary)
                const [walletRes, txRes] = await Promise.all([
                    getWalletBalance(),
                    getWalletTransactions(1, 100),
                ])

                if (cancelled) return

                const allTx = txRes.data

                // Split by source
                const purchaseTx = allTx.filter((tx) => tx.source === 'purchase')
                const unlockTx = allTx.filter((tx) => tx.source === 'chapter_unlock')

                setPurchases(purchaseTx.map(toTableRow))
                setUnlocks(unlockTx.map(toTableRow))
                setBalance(walletRes.balance)

                setSummary({
                    creditsBalance: walletRes.balance,
                    chaptersUnlocked: unlockTx.length,
                    // Total credits spent on purchases (sum of credit amounts)
                    totalSpent: `${purchaseTx.reduce((acc, tx) => acc + tx.amount, 0)}`,
                })
            } catch (err) {
                if (!cancelled) setError('Failed to load transactions. Please try again.')
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
                    Your credit purchases and chapter unlocks.
                </p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <TransactionSummary
                totalSpent={summary.totalSpent}
                creditsBalance={summary.creditsBalance}
                chaptersUnlocked={summary.chaptersUnlocked}
                loading={loading}
            />

            <Tabs defaultValue="credits" className="mt-6">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="credits" className="flex items-center gap-1.5 text-xs">
                        <Coins className="w-3.5 h-3.5" /> Credits
                    </TabsTrigger>
                    <TabsTrigger value="chapters" className="flex items-center gap-1.5 text-xs">
                        <BookOpen className="w-3.5 h-3.5" /> Chapters
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="credits">
                    <TransactionTable rows={purchases} creditsLabel="Credits" loading={loading} />
                </TabsContent>
                <TabsContent value="chapters">
                    <TransactionTable
                        rows={unlocks}
                        creditsLabel="Credits used"
                        hideAmount
                        loading={loading}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
