import { Coins, BookOpen, DollarSign, TrendingUp, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface TransactionSummaryProps {
    items?: Array<{
        icon: LucideIcon
        label: string
        value: string
    }>
    totalSpent?: string
    creditsBalance?: number
    chaptersUnlocked?: number
    isStoryteller?: boolean
    totalWithdrawn?: string // Storyteller only: total paid out
    loading?: boolean
}

export function TransactionSummary({
    items,
    totalSpent = '0',
    creditsBalance = 0,
    chaptersUnlocked = 0,
    isStoryteller = false,
    totalWithdrawn = '₱0.00',
    loading = false,
}: TransactionSummaryProps) {
    const stats = items ?? (isStoryteller
        ? [
              { icon: TrendingUp, label: 'Total earned', value: totalSpent },
              { icon: BookOpen, label: 'Chapters sold', value: `${chaptersUnlocked}` },
              { icon: DollarSign, label: 'Withdrawn', value: totalWithdrawn },
          ]
        : [
              { icon: Coins, label: 'Credit balance', value: `${creditsBalance}` },
              { icon: BookOpen, label: 'Chapters unlocked', value: `${chaptersUnlocked}` },
              { icon: DollarSign, label: 'Total spent', value: totalSpent },
          ])

    return (
        <div className="grid grid-cols-3 gap-2">
            {stats.map(({ icon: Icon, label, value }) => (
                <div
                    key={label}
                    className="rounded-lg border border-border bg-muted/30 px-3 py-3 space-y-1"
                >
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Icon className="w-3 h-3 shrink-0" />
                        <span className="text-[9px] sm:text-[11px] uppercase tracking-wide leading-tight">
                            {label}
                        </span>
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 w-12 mt-1" />
                    ) : (
                        <p className="text-sm sm:text-lg font-semibold tracking-tight break-words">
                            {value}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}
