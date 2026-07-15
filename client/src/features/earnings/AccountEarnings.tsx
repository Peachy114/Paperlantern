import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Download, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
    getAccountEarningsHistory,
    getAccountEarningsSummary,
    getAccountWithdrawalHistory,
    type EarningTransaction,
    type WithdrawalTransaction,
} from '@/api/wallet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import EarningHistoryList from '@/features/studio/components/earnings/EarningHistoryList'
import EarningOverview from '@/features/studio/components/earnings/EarningOverview'

const PER_PAGE = 20

export default function AccountEarnings() {
    const [page, setPage] = useState(1)

    const summaryQuery = useQuery({
        queryKey: ['account-earnings'],
        queryFn: getAccountEarningsSummary,
        staleTime: 1000 * 30,
    })

    const historyQuery = useQuery({
        queryKey: ['account-earnings-history', page],
        queryFn: () => getAccountEarningsHistory(page, PER_PAGE),
        staleTime: 1000 * 30,
    })

    const withdrawalsQuery = useQuery({
        queryKey: ['account-earnings-withdrawals'],
        queryFn: () => getAccountWithdrawalHistory(1, 200),
        staleTime: 1000 * 30,
    })

    const earnings = summaryQuery.data
    const history = historyQuery.data?.data ?? []
    const withdrawals = withdrawalsQuery.data?.data ?? []
    const hasPendingWithdrawal = earnings?.latest_withdrawal?.status === 'pending'
    const canWithdraw = earnings?.can_withdraw ?? false
    const isLoading = summaryQuery.isLoading || historyQuery.isLoading

    const latestWithdrawalNotice = useMemo(() => {
        if (!earnings?.latest_withdrawal) return null

        const withdrawal = earnings.latest_withdrawal
        const statusText =
            withdrawal.status === 'pending'
                ? 'is being reviewed'
                : withdrawal.status === 'approved'
                  ? 'was approved. Payout is coming soon'
                  : withdrawal.status === 'paid'
                    ? 'was paid out'
                    : 'was rejected'

        return `Your PHP ${Number(withdrawal.amount_php).toFixed(2)} withdrawal ${statusText}.`
    }, [earnings?.latest_withdrawal])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Account
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Income, withdrawal requests, and downloadable earning records.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => downloadExcel(history, withdrawals)}
                        disabled={history.length === 0 && withdrawals.length === 0}
                    >
                        <Download className="h-4 w-4" />
                        Download Excel
                    </Button>
                    <Button asChild disabled={!canWithdraw || hasPendingWithdrawal}>
                        <Link to="/withdrawals">
                        <Wallet className="h-4 w-4" />
                        Withdraw
                        </Link>
                    </Button>
                </div>
            </div>

            {latestWithdrawalNotice && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{latestWithdrawalNotice}</AlertDescription>
                </Alert>
            )}

            <EarningOverview
                balancePhp={Number(earnings?.withdrawable_php ?? earnings?.balance_php ?? 0)}
                balanceCredits={Number(earnings?.withdrawable_credits ?? earnings?.balance_credits ?? 0)}
                minWithdrawalCredits={Number(earnings?.min_withdrawal_credits ?? 10)}
                canWithdraw={earnings?.can_withdraw ?? false}
                loading={summaryQuery.isLoading}
            />

            <Separator />

            <EarningHistoryList
                history={history}
                loading={isLoading}
                page={historyQuery.data?.current_page ?? page}
                lastPage={historyQuery.data?.last_page ?? 1}
                total={historyQuery.data?.total ?? 0}
                onPageChange={setPage}
            />

        </div>
    )
}

function downloadExcel(earnings: EarningTransaction[], withdrawals: WithdrawalTransaction[]) {
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
            earnings.map((tx) => ({
                Date: new Date(tx.created_at).toLocaleString(),
                Source: tx.source ?? 'earning',
                Target:
                    tx.chapter?.title ??
                    tx.earnable?.title ??
                    tx.earnable?.service?.title ??
                    tx.earnable?.work?.title ??
                    tx.earnable?.name ??
                    '',
                Reader: tx.reader?.name ?? '',
                'Credits Earned': Number(tx.storyteller_cut).toFixed(2),
                'PHP Earned': Number(tx.storyteller_php).toFixed(2),
            }))
        ),
        'Earnings'
    )

    XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
            withdrawals.map((tx) => ({
                Date: new Date(tx.created_at).toLocaleString(),
                Method: tx.payout_method.toUpperCase(),
                Details: tx.payout_details,
                'Credits Redeemed': Number(tx.credits_redeemed).toFixed(2),
                'Amount PHP': Number(tx.amount_php).toFixed(2),
                Status: tx.status,
                Notes: tx.admin_notes ?? '',
            }))
        ),
        'Withdrawals'
    )

    XLSX.writeFile(wb, `earnings-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
