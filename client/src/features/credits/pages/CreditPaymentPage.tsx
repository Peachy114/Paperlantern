import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    Coins,
    ExternalLink,
    Loader2,
    RotateCw,
    XCircle,
} from 'lucide-react'
import { getCreditPayment, simulateCreditPayment } from '@/hooks/useWallet'
import type { CreditPayment, CreditPaymentStatus } from '@/types/wallet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function CreditPaymentPage() {
    const { paymentId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const announcedRef = useRef<string | null>(null)

    const returnedStatus = searchParams.get('status')

    const {
        data: payment,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['credit-payment', paymentId],
        queryFn: () => getCreditPayment(paymentId!),
        enabled: Boolean(paymentId),
        refetchInterval: (query) => (query.state.data?.status === 'pending' ? 5000 : false),
    })

    const simulateMutation = useMutation({
        mutationFn: (status: CreditPaymentStatus | 'success') =>
            simulateCreditPayment(paymentId!, status),
        onSuccess: ({ payment: updatedPayment }) => {
            queryClient.setQueryData(['credit-payment', paymentId], updatedPayment)
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
            announcePayment(updatedPayment, announcedRef, true)
        },
        onError: () => {
            toast.error('Could not simulate this payment.')
        },
    })

    useEffect(() => {
        if (!payment) return

        if (returnedStatus === 'success' && payment.status === 'pending') {
            announceOnce(announcedRef, 'pending-success', () =>
                toast.info('Payment submitted. Waiting for confirmation before credits are added.')
            )
            return
        }

        if (returnedStatus === 'failed' && payment.status === 'pending') {
            announceOnce(announcedRef, 'pending-failed-return', () =>
                toast.error('Payment was not completed.')
            )
            return
        }

        announcePayment(payment, announcedRef)

        if (payment.status === 'paid') {
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
        }
    }, [payment, queryClient, returnedStatus])

    const statusView = useMemo(() => getStatusView(payment?.status ?? 'pending'), [payment?.status])
    const StatusIcon = statusView.icon

    if (!paymentId) return null

    if (isLoading) {
        return (
            <div className="mx-auto flex min-h-[420px] max-w-2xl items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (isError || !payment) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-12">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Could not load this payment.</AlertDescription>
                </Alert>
                <Button className="mt-4" variant="outline" onClick={() => navigate('/credits')}>
                    Back to credits
                </Button>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Credits Payment
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight">Complete top up</h1>
                </div>
                <Badge variant={statusView.variant} className="h-6 capitalize">
                    {payment.status}
                </Badge>
            </div>

            <section className="rounded-xl border bg-background p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                <Coins className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {payment.credits.toLocaleString()} credits
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {payment.package?.name ?? 'Credit package'}
                                </p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Pay on this standalone LaterNComix page, then wait for confirmation so
                            your credits can be added safely.
                        </p>
                    </div>

                    <div className="rounded-lg border bg-muted/20 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                            Amount
                        </p>
                        <p className="mt-1 text-2xl font-semibold">
                            {formatCurrency(payment.amount, payment.currency)}
                        </p>
                    </div>
                </div>

                <Separator className="my-5" />

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <Detail label="Reference" value={payment.reference_id ?? payment.id} />
                    <Detail label="Mode" value={payment.provider_mode} />
                    <Detail label="Expires" value={formatDate(payment.expires_at)} />
                    <Detail label="Updated" value={formatDate(statusDate(payment))} />
                </div>

                <Alert className={`mt-5 ${statusView.className}`}>
                    <StatusIcon className="h-4 w-4" />
                    <AlertDescription>{statusView.message}</AlertDescription>
                </Alert>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    {payment.status === 'pending' && payment.checkout_url && (
                        <Button asChild>
                            <a href={payment.checkout_url}>
                                <ExternalLink className="h-4 w-4" />
                                Open secure checkout
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => refetch()}>
                        <RotateCw className="h-4 w-4" />
                        Refresh status
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link to="/credits">Back to credits</Link>
                    </Button>
                </div>
            </section>

            {payment.can_simulate && payment.status !== 'paid' && (
                <section className="mt-5 rounded-xl border border-dashed bg-muted/10 p-5">
                    <div className="mb-4">
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                            Test Mode
                        </p>
                        <h2 className="mt-1 text-base font-semibold">Simulate payment</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            PayMongo is using test keys, so you can complete this payment without
                            leaving the app.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            onClick={() => simulateMutation.mutate('success')}
                            disabled={simulateMutation.isPending}
                        >
                            {simulateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Simulate success
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => simulateMutation.mutate('failed')}
                            disabled={simulateMutation.isPending}
                        >
                            <XCircle className="h-4 w-4" />
                            Simulate failed
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => simulateMutation.mutate('expired')}
                            disabled={simulateMutation.isPending}
                        >
                            <Clock3 className="h-4 w-4" />
                            Simulate expired
                        </Button>
                    </div>
                </section>
            )}
        </div>
    )
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-background px-3 py-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-sm font-medium">{value}</p>
        </div>
    )
}

function getStatusView(status: CreditPaymentStatus) {
    if (status === 'paid') {
        return {
            icon: CheckCircle2,
            variant: 'default' as const,
            className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200',
            message: 'Payment confirmed. Your credits were added to your wallet.',
        }
    }

    if (status === 'failed') {
        return {
            icon: XCircle,
            variant: 'destructive' as const,
            className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200',
            message: 'Payment failed. No credits were added.',
        }
    }

    if (status === 'expired') {
        return {
            icon: Clock3,
            variant: 'secondary' as const,
            className: 'border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200',
            message: 'Payment expired. Start a new top up when you are ready.',
        }
    }

    return {
        icon: Clock3,
        variant: 'outline' as const,
        className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
        message: 'Waiting for payment confirmation. Credits will be added after confirmation.',
    }
}

function announcePayment(
    payment: CreditPayment,
    announcedRef: MutableRefObject<string | null>,
    force = false
) {
    const key = `status-${payment.status}`
    if (!force && announcedRef.current === key) return

    announcedRef.current = key

    if (payment.status === 'paid') {
        toast.success(`${payment.credits.toLocaleString()} credits added to your wallet.`)
    } else if (payment.status === 'failed') {
        toast.error('Payment failed. No credits were added.')
    } else if (payment.status === 'expired') {
        toast.warning('Payment expired. No credits were added.')
    }
}

function announceOnce(
    announcedRef: MutableRefObject<string | null>,
    key: string,
    callback: () => void
) {
    if (announcedRef.current === key) return
    announcedRef.current = key
    callback()
}

function statusDate(payment: CreditPayment): string | null {
    if (payment.status === 'paid') return payment.paid_at
    if (payment.status === 'failed') return payment.failed_at
    if (payment.status === 'expired') return payment.expired_at
    return payment.expires_at
}

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: currency || 'PHP',
    }).format(amount)
}

function formatDate(value: string | null) {
    if (!value) return '-'
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}
