import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/api/axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

type RevenueType = 'artist' | 'noble' | 'subscription' | 'topups'

interface RevenueResponse {
    summary: {
        artist: { credits: number; php: number; count: number }
        noble: { credits: number; php: number; count: number }
        topups: { credits: number; count: number }
        pending_withdrawals: { count: number; php: number }
    }
    payout_settings: {
        day: string
        notice: string
    }
    data: {
        data: RevenueRow[]
        current_page: number
        last_page: number
        total: number
    }
}

type RevenueRow = {
    id: string
    created_at: string
    source?: string
    description: string
    credits_spent?: number
    platform_cut?: number
    platform_php?: number
    receiver_cut?: number
    receiver_php?: number
    credits?: number
    balance_after?: number
    sender?: Person | null
    receiver?: Person | null
    user?: Person | null
}

type Person = {
    name: string
    email: string
    role: string
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function AdminEarnings() {
    const queryClient = useQueryClient()
    const [mainTab, setMainTab] = useState<'platform' | 'topups'>('platform')
    const [type, setType] = useState<RevenueType>('artist')
    const [page, setPage] = useState(1)
    const [payoutDay, setPayoutDay] = useState('thursday')
    const [notice, setNotice] = useState('')

    const revenue = useQuery({
        queryKey: ['admin-revenue', type, page],
        queryFn: () =>
            api
                .get<RevenueResponse>('/admin/revenue', {
                    params: { type, page, per_page: 20 },
                })
                .then((res) => res.data),
    })

    useEffect(() => {
        if (!revenue.data?.payout_settings) return
        setPayoutDay(revenue.data.payout_settings.day)
        setNotice(revenue.data.payout_settings.notice)
    }, [revenue.data?.payout_settings])

    const savePayout = useMutation({
        mutationFn: () => api.put('/admin/payout-settings', { day: payoutDay, notice }),
        onSuccess: () => {
            toast.success('Payout settings saved.')
            queryClient.invalidateQueries({ queryKey: ['admin-revenue'] })
        },
        onError: () => toast.error('Could not save payout settings.'),
    })

    const simulatePayouts = useMutation({
        mutationFn: () =>
            api.post<{ message: string; data: { processed: number; total_php: number } }>(
                '/admin/payouts/simulate'
            ),
        onSuccess: (res) => {
            const data = res.data.data
            toast.success(
                `${res.data.message} Total paid: PHP ${Number(data.total_php ?? 0).toFixed(2)}.`
            )
            queryClient.invalidateQueries({ queryKey: ['admin-revenue'] })
        },
        onError: () => toast.error('Could not simulate payouts.'),
    })

    function changeType(next: RevenueType) {
        setType(next)
        setPage(1)
    }

    function changeMainTab(next: string) {
        const value = next as 'platform' | 'topups'
        setMainTab(value)
        setPage(1)
        setType(value === 'topups' ? 'topups' : 'artist')
    }

    const rows = revenue.data?.data.data ?? []
    const paginator = revenue.data?.data

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
                <Link to="/admin">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Admin
                </Link>
            </Button>

            <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Admin Panel
                </p>
                <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Platform earnings, Noble Royalty earnings, subscriptions placeholder, top-up
                    purchases, and payout schedule.
                </p>
            </div>

            <SummaryCards summary={revenue.data?.summary} loading={revenue.isLoading} />

            <section className="mt-5 rounded-xl border bg-background p-4">
                <div className="mb-4">
                    <h2 className="font-semibold">Payout Settings</h2>
                    <p className="text-sm text-muted-foreground">
                        Users can request withdrawals on the selected payout day. Admin can process
                        withdrawals anytime.
                    </p>
                </div>
                <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto_auto] lg:items-end">
                    <div className="space-y-1.5">
                        <Label>Payout day</Label>
                        <select
                            value={payoutDay}
                            onChange={(event) => setPayoutDay(event.target.value)}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        >
                            {DAYS.map((day) => (
                                <option key={day} value={day}>
                                    {capitalize(day)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Notice</Label>
                        <Input value={notice} onChange={(event) => setNotice(event.target.value)} />
                    </div>
                    <Button onClick={() => savePayout.mutate()} disabled={savePayout.isPending}>
                        {savePayout.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => simulatePayouts.mutate()}
                        disabled={simulatePayouts.isPending}
                    >
                        {simulatePayouts.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Simulate Payouts
                    </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                    Simulation marks pending withdrawal requests as paid without sending real
                    PayMongo funds. Use this until PayMongo disbursement webhooks are connected.
                </p>
            </section>

            <Tabs value={mainTab} onValueChange={changeMainTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="platform">Platform Earnings</TabsTrigger>
                    <TabsTrigger value="topups">Top-up Credits</TabsTrigger>
                </TabsList>

                <TabsContent value="platform" className="space-y-4">
                    <Tabs value={type === 'topups' ? 'artist' : type} onValueChange={(value) => changeType(value as RevenueType)}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="artist">Artist</TabsTrigger>
                            <TabsTrigger value="noble">Noble Royalty</TabsTrigger>
                            <TabsTrigger value="subscription">Subscription</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <RevenueTable
                        rows={rows}
                        loading={revenue.isLoading}
                        type={type === 'topups' ? 'artist' : type}
                    />
                    <Pagination
                        page={paginator?.current_page ?? page}
                        lastPage={paginator?.last_page ?? 1}
                        total={paginator?.total ?? 0}
                        onPage={setPage}
                    />
                </TabsContent>

                <TabsContent value="topups">
                    <RevenueTable rows={rows} loading={revenue.isLoading} type="topups" />
                    <Pagination
                        page={paginator?.current_page ?? page}
                        lastPage={paginator?.last_page ?? 1}
                        total={paginator?.total ?? 0}
                        onPage={setPage}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function SummaryCards({
    summary,
    loading,
}: {
    summary?: RevenueResponse['summary']
    loading: boolean
}) {
    const cards = [
        { label: 'Artist Platform', value: php(summary?.artist.php), sub: `${credits(summary?.artist.credits)} credits` },
        { label: 'Noble Royalty', value: php(summary?.noble.php), sub: `${credits(summary?.noble.credits)} credits` },
        { label: 'Top-up Credits', value: credits(summary?.topups.credits), sub: `${summary?.topups.count ?? 0} purchases` },
        { label: 'Pending Payouts', value: php(summary?.pending_withdrawals.php), sub: `${summary?.pending_withdrawals.count ?? 0} requests` },
    ]

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <div key={card.label} className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold">{loading ? '-' : card.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{loading ? '-' : card.sub}</p>
                </div>
            ))}
        </div>
    )
}

function RevenueTable({
    rows,
    loading,
    type,
}: {
    rows: RevenueRow[]
    loading: boolean
    type: RevenueType
}) {
    if (loading) {
        return (
            <div className="mt-4 flex justify-center rounded-xl border py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (rows.length === 0) {
        return (
            <div className="mt-4 rounded-xl border py-16 text-center text-sm text-muted-foreground">
                {type === 'subscription'
                    ? 'Subscription revenue will appear here when subscription features are added.'
                    : 'No revenue records yet.'}
            </div>
        )
    }

    return (
        <div className="mt-4 overflow-hidden rounded-xl border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Credits</TableHead>
                        <TableHead className="text-right">Platform PHP</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                {new Date(row.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <p className="font-medium">{row.description}</p>
                                {row.source && (
                                    <Badge variant="outline" className="mt-1">
                                        {row.source.replaceAll('_', ' ')}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {type === 'topups'
                                    ? row.user?.name ?? 'User'
                                    : row.receiver?.name ?? 'Receiver'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {credits(type === 'topups' ? row.credits : row.platform_cut)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {type === 'topups' ? '-' : php(row.platform_php)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function Pagination({
    page,
    lastPage,
    total,
    onPage,
}: {
    page: number
    lastPage: number
    total: number
    onPage: (page: number) => void
}) {
    if (lastPage <= 1) {
        return <p className="mt-3 text-xs text-muted-foreground">{total} records</p>
    }

    return (
        <div className="mt-3 flex items-center justify-between rounded-xl border bg-background px-3 py-2">
            <p className="text-xs text-muted-foreground">
                Page {page} of {lastPage} · {total} records
            </p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= lastPage}
                    onClick={() => onPage(page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}

function php(value?: number) {
    return `PHP ${Number(value ?? 0).toFixed(2)}`
}

function credits(value?: number) {
    return Number(value ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
}
