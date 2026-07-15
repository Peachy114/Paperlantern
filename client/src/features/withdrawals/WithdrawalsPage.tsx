import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, Loader2, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
    getAccountEarningsSummary,
    getAccountWithdrawalHistory,
    getPaymentSettings,
    requestAccountWithdrawal,
} from '@/api/wallet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

type PayoutMethod = 'gcash' | 'maya' | 'bank'

export default function WithdrawalsPage() {
    const queryClient = useQueryClient()
    const [method, setMethod] = useState<PayoutMethod>('gcash')
    const [amount, setAmount] = useState('')
    const [accountName, setAccountName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [bankName, setBankName] = useState('')

    const summaryQuery = useQuery({
        queryKey: ['account-earnings'],
        queryFn: getAccountEarningsSummary,
    })
    const paymentsQuery = useQuery({
        queryKey: ['payment-settings'],
        queryFn: getPaymentSettings,
    })
    const historyQuery = useQuery({
        queryKey: ['account-earnings-withdrawals', 1],
        queryFn: () => getAccountWithdrawalHistory(1, 20),
    })

    const paymentSettings = paymentsQuery.data?.payment_settings
    useEffect(() => {
        if (!paymentSettings) return
        if (method === 'gcash') {
            setAccountName(paymentSettings.gcash.account_name)
            setAccountNumber(paymentSettings.gcash.account_number)
            setBankName('')
        }
        if (method === 'maya') {
            setAccountName(paymentSettings.maya.account_name)
            setAccountNumber(paymentSettings.maya.account_number)
            setBankName('')
        }
        if (method === 'bank') {
            setAccountName('')
            setAccountNumber('')
            setBankName('')
        }
    }, [method, paymentSettings])

    const summary = summaryQuery.data
    const withdrawablePhp = Number(summary?.withdrawable_php ?? summary?.balance_php ?? 0)
    const withdrawableCredits = Number(summary?.withdrawable_credits ?? summary?.balance_credits ?? 0)
    const storedPhpBalance = Number(summary?.balance_php ?? 0)
    const canRequest = Boolean(summary?.can_withdraw)
    const hasMinimum = Boolean(summary?.has_minimum_balance ?? summary?.can_withdraw)
    const details = useMemo(() => {
        if (method === 'bank') {
            return `Bank: ${bankName}; Account name: ${accountName}; Account number: ${accountNumber}`
        }
        return `Account name: ${accountName}; Account number: ${accountNumber}`
    }, [accountName, accountNumber, bankName, method])

    const submit = useMutation({
        mutationFn: () =>
            requestAccountWithdrawal({
                amount_php: Number(amount),
                payout_method: method,
                payout_details: details,
            }),
        onSuccess: (res) => {
            if (!res.success) {
                toast.error(res.message)
                return
            }
            toast.success('Withdrawal request submitted.')
            setAmount('')
            queryClient.invalidateQueries({ queryKey: ['account-earnings'] })
            queryClient.invalidateQueries({ queryKey: ['account-earnings-withdrawals'] })
        },
        onError: () => toast.error('Could not submit withdrawal request.'),
    })

    function handleSubmit() {
        const requested = Number(amount)
        if (requested > withdrawablePhp) {
            toast.error(`You can withdraw up to PHP ${withdrawablePhp.toFixed(2)} right now.`)
            setAmount(withdrawablePhp > 0 ? withdrawablePhp.toFixed(2) : '')
            return
        }

        submit.mutate()
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
                <Link to="/earnings">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Earnings
                </Link>
            </Button>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Account
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight">Withdrawals</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Request earnings payout anytime. Approved payouts are processed on the
                        scheduled payout day.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link to="/settings/payments">Payment Settings</Link>
                </Button>
            </div>

            {summaryQuery.isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
                    <section className="space-y-4 rounded-xl border bg-background p-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Available earnings</p>
                            <p className="mt-1 text-2xl font-bold">
                                PHP {withdrawablePhp.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {withdrawableCredits.toFixed(2)} credits
                            </p>
                            {storedPhpBalance > withdrawablePhp ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Adjusted to the current payout rate of 1 credit = PHP 1.00.
                                </p>
                            ) : null}
                        </div>

                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {summary?.payout_notice ??
                                    'Withdrawals are available every Thursday. Requests may be reviewed and processed throughout the payout day.'}
                                {!summary?.is_payout_day && summary?.next_payout_at ? (
                                    <>
                                        {' '}
                                        Next payout day:{' '}
                                        {new Date(summary.next_payout_at).toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                        .
                                    </>
                                ) : null}
                                {' '}Transfer fees are shouldered by the withdrawing artist or wanderer.
                            </AlertDescription>
                        </Alert>

                        <p className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            PayMongo disbursement fees, such as the PHP 10.00 InstaPay/PESONet
                            transfer fee, are deducted from the withdrawing artist or wanderer when
                            payouts are processed.
                        </p>

                        {!hasMinimum && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Minimum withdrawal is{' '}
                                    {Number(summary?.min_withdrawal_credits ?? 10).toFixed(0)} credits.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <Label>Amount (PHP)</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    disabled={withdrawablePhp <= 0}
                                    onClick={() => setAmount(withdrawablePhp.toFixed(2))}
                                >
                                    Use max
                                </Button>
                            </div>
                            <Input
                                type="number"
                                min={1}
                                max={withdrawablePhp}
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Payout method</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['gcash', 'maya', 'bank'] as PayoutMethod[]).map((option) => (
                                    <Button
                                        key={option}
                                        type="button"
                                        variant={method === option ? 'default' : 'outline'}
                                        onClick={() => setMethod(option)}
                                    >
                                        {methodLabel(option)}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {method === 'bank' && (
                            <div className="space-y-1.5">
                                <Label>Bank name</Label>
                                <Input
                                    value={bankName}
                                    onChange={(event) => setBankName(event.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Account name</Label>
                            <Input
                                value={accountName}
                                onChange={(event) => setAccountName(event.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Account number</Label>
                            <Input
                                value={accountNumber}
                                onChange={(event) => setAccountNumber(event.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full"
                            disabled={
                                submit.isPending ||
                                !canRequest ||
                                !amount ||
                                !accountName ||
                                !accountNumber ||
                                (method === 'bank' && !bankName)
                            }
                            onClick={handleSubmit}
                        >
                            <Wallet className="h-4 w-4" />
                            Request Withdrawal
                        </Button>
                    </section>

                    <section className="rounded-xl border bg-background">
                        <div className="border-b px-4 py-3">
                            <h2 className="font-semibold">Withdrawal History</h2>
                        </div>
                        <div className="divide-y">
                            {(historyQuery.data?.data ?? []).length === 0 ? (
                                <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                                    No withdrawal requests yet.
                                </p>
                            ) : (
                                historyQuery.data!.data.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium">
                                                PHP {Number(item.amount_php).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.payout_method.toUpperCase()} ·{' '}
                                                {new Date(item.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge>{item.status}</Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    )
}

function methodLabel(method: PayoutMethod) {
    if (method === 'gcash') return 'GCash'
    if (method === 'maya') return 'Maya'
    return 'Bank'
}
