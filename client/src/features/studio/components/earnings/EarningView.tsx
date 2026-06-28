import { useState } from 'react'
import {
    useEarnings,
    useEarningHistory,
    requestWithdrawal,
} from '@/features/studio/hooks/useEarnings'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

import EarningHeader from './EarningHeader'
import EarningOverview from './EarningOverview'
import EarningHistoryList from './EarningHistoryList'
import EarningWithdrawal from './EarningWithdrawal'

const PAYOUT_METHODS = ['gcash', 'maya', 'bank'] as const
type PayoutMethod = (typeof PAYOUT_METHODS)[number]

export default function EarningView() {
    const { earnings, loading: earningsLoading, refetch } = useEarnings()
    const {
        history,
        loading: historyLoading,
        page,
        setPage,
        lastPage,
        total,
    } = useEarningHistory(10)

    const [showWithdraw, setShowWithdraw] = useState(false)
    const [method, setMethod] = useState<PayoutMethod>('gcash')
    const [details, setDetails] = useState('')
    const [amount, setAmount] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [withdrawError, setWithdrawError] = useState<string | null>(null)

    async function handleWithdraw() {
        setSubmitting(true)
        setWithdrawError(null)
        try {
            const res = await requestWithdrawal({
                amount_php: parseFloat(amount),
                payout_method: method,
                payout_details: details,
            })
            if (res.success) {
                setShowWithdraw(false)
                setAmount('')
                setDetails('')
                refetch()
            } else {
                setWithdrawError(res.message)
            }
        } catch {
            setWithdrawError('Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const canWithdraw = earnings?.can_withdraw ?? false
    const hasPendingWithdrawal = earnings?.latest_withdrawal?.status === 'pending'
    const withdrawals = history ?? [] // reuse the history you already fetched
    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <EarningHeader
                canWithdraw={canWithdraw}
                hasPendingWithdrawal={hasPendingWithdrawal}
                onWithdraw={handleWithdraw}
                earnings={history ?? []}
                withdrawals={[]}
            />

            <EarningOverview
                balancePhp={Number(earnings?.balance_php ?? 0)}
                balanceCredits={earnings?.balance_credits ?? 0}
                minWithdrawal={Number(earnings?.min_withdrawal ?? 200)}
                canWithdraw={earnings?.can_withdraw ?? false}
                loading={earningsLoading}
            />

            {/* Commission note */}
            <p className="text-xs text-muted-foreground">
                💡 You earn <strong>80%</strong> of every credit spent on your chapters. Later N
                Comix keeps 20%.
            </p>

            {/* Latest withdrawal status */}
            {earnings?.latest_withdrawal && (
                <Alert>
                    <AlertDescription>
                        💸 Your ₱{Number(earnings.latest_withdrawal.amount_php).toFixed(2)}{' '}
                        withdrawal{' '}
                        {earnings.latest_withdrawal.status === 'pending' && 'is being reviewed'}
                        {earnings.latest_withdrawal.status === 'approved' &&
                            'was approved — payout coming soon'}
                        {earnings.latest_withdrawal.status === 'rejected' && 'was rejected'}
                        {earnings.latest_withdrawal.status === 'paid' && 'was paid out'}
                        {earnings.latest_withdrawal.admin_notes && (
                            <em> "{earnings.latest_withdrawal.admin_notes}"</em>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <Separator />

            <EarningHistoryList
                history={history}
                loading={historyLoading}
                page={page}
                lastPage={lastPage}
                total={total}
                onPageChange={setPage}
            />

            <EarningWithdrawal
                open={showWithdraw}
                balancePhp={Number(earnings?.balance_php ?? 0)}
                method={method}
                details={details}
                amount={amount}
                submitting={submitting}
                error={withdrawError}
                onClose={() => {
                    setShowWithdraw(false)
                    setWithdrawError(null)
                }}
                onMethodChange={setMethod}
                onDetailsChange={setDetails}
                onAmountChange={setAmount}
                onSubmit={handleWithdraw}
            />
        </div>
    )
}
