import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
    balancePhp: number
    balanceCredits: number
    minWithdrawal: number
    canWithdraw: boolean
    loading: boolean
}

export default function EarningOverview({
    balancePhp,
    balanceCredits,
    minWithdrawal,
    canWithdraw,
    loading,
}: Props) {
    const stats = [
        {
            label: 'PHP Balance',
            value: `₱${balancePhp.toFixed(2)}`,
            note: 'cash out anytime',
        },
        {
            label: 'Credits Earned',
            value: balanceCredits.toLocaleString(),
            note: 'keep it up!',
        },
        {
            label: 'Min. Withdrawal',
            value: `₱${minWithdrawal.toFixed(0)}`,
            note: canWithdraw ? 'ready to cash out!' : 'almost there!',
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {stats.map(({ label, value, note }) => (
                <Card key={label} className="shadow-none">
                    <CardContent className="pt-5">
                        {loading ? (
                            <>
                                <Skeleton className="h-8 w-24 mb-2" />
                                <Skeleton className="h-3 w-16" />
                            </>
                        ) : (
                            <>
                                <p className="text-2xl font-bold tracking-tight">{value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{label}</p>
                                <p className="text-xs text-muted-foreground/60 mt-0.5 italic">
                                    {note}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
