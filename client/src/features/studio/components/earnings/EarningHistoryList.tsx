import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import EarningHistoryListTable from './EarningHistoryListTable'
import type { EarningTransaction } from '@/features/studio/hooks/useEarnings'

interface Props {
    history: EarningTransaction[]
    loading: boolean
    page: number
    lastPage: number
    total: number
    onPageChange: (page: number) => void
}

export default function EarningHistoryList({
    history,
    loading,
    page,
    lastPage,
    total,
    onPageChange,
}: Props) {
    return (
        <Card className="shadow-none">
            <CardHeader className="pb-0 pt-4 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Earning History
                </CardTitle>
                <Badge variant="secondary">{total} transactions</Badge>
            </CardHeader>
            <CardContent className="p-0 mt-2">
                {loading ? (
                    <div className="p-4 flex flex-col gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-sm text-muted-foreground">No earnings yet.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Readers unlock your chapters to start earning.
                        </p>
                    </div>
                ) : (
                    <EarningHistoryListTable history={history} />
                )}

                {lastPage > 1 && (
                    <div className="px-4 py-3 border-t flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Page {page} of {lastPage}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(page - 1)}
                                disabled={page === 1}
                            >
                                ←
                            </Button>
                            {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                                <Button
                                    key={p}
                                    variant={p === page ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => onPageChange(p)}
                                >
                                    {p}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(page + 1)}
                                disabled={page === lastPage}
                            >
                                →
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
