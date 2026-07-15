import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import type { EarningTransaction } from '@/api/wallet'

interface Props {
    history: EarningTransaction[]
}

export default function EarningHistoryListTable({ history }: Props) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead>#</TableHead>
                        <TableHead>Chapter</TableHead>
                        <TableHead className="hidden sm:table-cell">Reader</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Credits</TableHead>
                        <TableHead className="text-right">You Earned</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {history.map((tx, i) => (
                        <TableRow key={tx.id}>
                            <TableCell className="text-xs text-muted-foreground tabular-nums w-8">
                                {String(i + 1).padStart(2, '0')}
                            </TableCell>
                            <TableCell>
                                <p className="text-sm font-medium truncate max-w-[180px]">
                                    {earningLabel(tx)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(tx.created_at).toLocaleDateString('en-PH', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                {tx.reader?.name ?? 'Reader'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-right text-sm text-muted-foreground tabular-nums">
                                {tx.credits_spent} cr
                            </TableCell>
                            <TableCell className="text-right">
                                <p className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums">
                                    +₱{Number(tx.storyteller_php).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {tx.storyteller_cut} credits
                                </p>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function earningLabel(tx: EarningTransaction) {
    const source = (tx.source ?? 'earning')
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    const title =
        tx.chapter?.title ??
        tx.earnable?.title ??
        tx.earnable?.service?.title ??
        tx.earnable?.work?.title ??
        tx.earnable?.name ??
        tx.earnable?.body ??
        ''

    return title ? `${source} - ${title}` : source
}
