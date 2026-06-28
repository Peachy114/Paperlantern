import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, Download, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import type { WithdrawalTransaction, EarningTransaction } from '@/api/wallet'

interface Props {
    canWithdraw: boolean
    hasPendingWithdrawal: boolean
    onWithdraw: () => void
    earnings: EarningTransaction[]
    withdrawals: WithdrawalTransaction[]
}

function downloadExcel(earnings: EarningTransaction[], withdrawals: WithdrawalTransaction[]) {
    const wb = XLSX.utils.book_new()

    const earningsData = earnings.map((tx) => ({
        Date: new Date(tx.created_at).toLocaleDateString('en-US'),
        Chapter: tx.chapter?.title ?? '—',
        Reader: tx.reader?.name ?? '—',
        'Credits Earned': tx.storyteller_cut,
        'PHP Earned': tx.storyteller_php,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(earningsData), 'Earnings')

    const withdrawalsData = withdrawals.map((tx: WithdrawalTransaction) => ({
        Date: new Date(tx.created_at).toLocaleDateString('en-US'),
        Method: tx.payout_method.toUpperCase(),
        Details: tx.payout_details,
        'Amount (PHP)': tx.amount_php,
        Status: tx.status,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(withdrawalsData), 'Withdrawals')

    XLSX.writeFile(wb, `earnings-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// Days remaining until end of month
function daysUntilEndOfMonth(): number {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return endOfMonth.getDate() - now.getDate()
}

export default function EarningHeader({
    canWithdraw,
    hasPendingWithdrawal,
    onWithdraw,
    earnings,
    withdrawals,
}: Props) {
    const navigate = useNavigate()
    const daysLeft = daysUntilEndOfMonth()
    const isUrgent = daysLeft <= 5

    return (
        <>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <button
                        onClick={() => navigate('/studio')}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Studio
                    </button>
                    <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your readers support your work
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadExcel(earnings, withdrawals)}
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download Excel
                    </Button>
                    <Button
                        onClick={onWithdraw}
                        disabled={!canWithdraw || hasPendingWithdrawal}
                        variant="outline"
                    >
                        Withdraw
                    </Button>
                </div>
            </div>

            <Alert
                className={
                    isUrgent
                        ? 'border-destructive/60 bg-destructive/10'
                        : 'border-yellow-500/40 bg-yellow-500/10'
                }
            >
                <AlertTriangle
                    className={`h-4 w-4 ${isUrgent ? 'text-destructive' : 'text-yellow-600'}`}
                />
                <AlertDescription
                    className={`text-sm ${isUrgent ? 'text-destructive' : 'text-yellow-700 dark:text-yellow-400'}`}
                >
                    {isUrgent
                        ? `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} left this month! Download your earnings report before they are cleared at month-end.`
                        : `Your earning history is cleared at the end of each month. Download your Excel report to keep a personal record. ${daysLeft} days remaining.`}
                </AlertDescription>
            </Alert>

            <Separator className="mt-4" />
        </>
    )
}
