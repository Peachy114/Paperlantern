import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import type { Transaction, TransactionStatus } from '@/types/transaction'

interface TransactionTableProps {
    rows: Transaction[]
    creditsLabel?: string
    hideAmount?: boolean
    loading?: boolean
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
}: TransactionTableProps) {
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
                {rows.map((row) => {
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
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => {
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
        </>
    )
}
