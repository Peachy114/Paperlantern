import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import type { Transaction } from '@/types/transaction'

interface TransactionTableProps {
    rows: Transaction[]
    creditsLabel?: string
    hideAmount?: boolean
    loading?: boolean
    pageSize?: number
}

const STATUS_MAP = {
    success: { label: 'Success', variant: 'default' as const },
    pending: { label: 'Pending', variant: 'secondary' as const },
    failed: { label: 'Failed', variant: 'destructive' as const },
}

export function TransactionTable({
    rows,
    creditsLabel = 'Credits',
    hideAmount = false,
    loading = false,
    pageSize,
}: TransactionTableProps) {
    const showBalance = rows.some((row) => row.balance)
    const [page, setPage] = useState(1)
    const totalPages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1
    const visibleRows = useMemo(() => {
        if (!pageSize) return rows
        const safePage = Math.min(page, totalPages)
        const start = (safePage - 1) * pageSize
        return rows.slice(start, start + pageSize)
    }, [page, pageSize, rows, totalPages])

    if (loading) {
        return (
            <div className="mt-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
            </div>
        )
    }

    if (rows.length === 0) {
        return (
            <div className="mt-4 rounded-lg border border-border bg-muted/20 py-12 text-center text-sm text-muted-foreground">
                No transactions yet.
            </div>
        )
    }

    return (
        <>
            {/* ── Mobile: collapsible cards ── */}
            <div className="mt-4 space-y-2 sm:hidden">
                {visibleRows.map((row) => {
                    const { label, variant } = STATUS_MAP[row.status]
                    return (
                        <Collapsible key={row.id}>
                            <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 px-4 py-3 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {row.date}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium tabular-nums">
                                            {row.credits}
                                        </span>
                                        <Badge variant={variant} className="text-[10px]">
                                            {label}
                                        </Badge>
                                    </div>
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="rounded-b-lg border border-t-0 border-border bg-muted/5 px-4 py-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-xs uppercase tracking-wide">
                                            Description
                                        </span>
                                        <span className="text-foreground/80 text-right max-w-[60%]">
                                            {row.description}
                                        </span>
                                    </div>
                                    {!hideAmount && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-xs uppercase tracking-wide">
                                                Amount
                                            </span>
                                            <span className="tabular-nums">{row.amount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-xs uppercase tracking-wide">
                                            {creditsLabel}
                                        </span>
                                        <span className="tabular-nums font-medium">
                                            {row.credits}
                                        </span>
                                    </div>
                                    {showBalance && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-xs uppercase tracking-wide">
                                                Balance
                                            </span>
                                            <span className="tabular-nums font-medium">
                                                {row.balance ?? '-'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )
                })}
            </div>

            {/* ── Desktop: full table ── */}
            <div className="mt-4 rounded-lg border border-border overflow-hidden hidden sm:block">
                <Table>
                    <TableHeader>
                        <TableRow className="text-xs">
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            {!hideAmount && <TableHead className="text-right">Amount</TableHead>}
                            <TableHead className="text-right">{creditsLabel}</TableHead>
                            {showBalance && <TableHead className="text-right">Balance</TableHead>}
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleRows.map((row) => {
                            const { label, variant } = STATUS_MAP[row.status]
                            return (
                                <TableRow key={row.id} className="text-sm">
                                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                                        {row.date}
                                    </TableCell>
                                    <TableCell className="text-foreground/80">
                                        {row.description}
                                    </TableCell>
                                    {!hideAmount && (
                                        <TableCell className="text-right tabular-nums">
                                            {row.amount}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right tabular-nums font-medium">
                                        {row.credits}
                                    </TableCell>
                                    {showBalance && (
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {row.balance ?? '-'}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right">
                                        <Badge variant={variant} className="text-[10px]">
                                            {label}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
            {pageSize && totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                        Page {Math.min(page, totalPages)} of {totalPages}
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            disabled={page <= 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            disabled={page >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}
