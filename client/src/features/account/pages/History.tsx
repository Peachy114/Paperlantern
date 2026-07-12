import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpenCheck, Heart, MessageCircle, Receipt, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { accountApi, type AccountComment, type ChapterHistoryItem, type WalletHistoryItem } from '@/api/account'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function History() {
    const { data, isLoading } = useQuery({
        queryKey: ['account-history'],
        queryFn: () => accountApi.history().then((res) => res.data),
    })

    return (
        <main className="mx-auto max-w-[1200px] px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">History</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Chapters read, likes, comments, and bought items.
                </p>
            </div>

            {isLoading || !data ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-64 rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    <HistoryPanel
                        title="Chapters Read"
                        icon={BookOpenCheck}
                        items={data.read}
                        empty="No chapters read yet"
                        render={(item) => <ChapterRow item={item} />}
                    />
                    <HistoryPanel
                        title="Likes"
                        icon={Heart}
                        items={data.liked}
                        empty="No liked chapters yet"
                        render={(item) => <ChapterRow item={item} />}
                    />
                    <HistoryPanel
                        title="Comments"
                        icon={MessageCircle}
                        items={data.commented}
                        empty="No comment history yet"
                        render={(item) => <CommentRow item={item} />}
                    />
                    <HistoryPanel
                        title="Bought"
                        icon={Receipt}
                        items={[...data.bought.chapters, ...data.bought.transactions]}
                        empty="No bought items yet"
                        render={(item) =>
                            'chapter' in item ? (
                                <ChapterRow item={item as ChapterHistoryItem} />
                            ) : (
                                <WalletRow item={item as WalletHistoryItem} />
                            )
                        }
                    />
                </div>
            )}
        </main>
    )
}

function HistoryPanel<T>({
    title,
    icon: Icon,
    items,
    empty,
    render,
}: {
    title: string
    icon: LucideIcon
    items: T[]
    empty: string
    render: (item: T) => ReactNode
}) {
    return (
        <section className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <h2 className="text-sm font-semibold">{title}</h2>
                <span className="text-xs text-muted-foreground">({items.length})</span>
            </div>
            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                    {empty}
                </div>
            ) : (
                <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                    {items.map((item, index) => (
                        <div key={itemKey(item, index)}>{render(item)}</div>
                    ))}
                </div>
            )}
        </section>
    )
}

function ChapterRow({ item }: { item: ChapterHistoryItem }) {
    return (
        <Link
            to={item.href}
            className="block rounded-md border bg-muted/10 p-3 transition hover:bg-muted/30"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.chapter.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.work.title}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                    {item.work.type === 'wattpad' ? 'novel' : 'webtoon'}
                </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
        </Link>
    )
}

function CommentRow({ item }: { item: AccountComment }) {
    const body = (
        <div className="rounded-md border bg-muted/10 p-3">
            <p className="truncate text-sm font-medium">{item.origin.title}</p>
            {item.body && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
        </div>
    )

    return item.origin.href ? <Link to={item.origin.href}>{body}</Link> : body
}

function WalletRow({ item }: { item: WalletHistoryItem }) {
    return (
        <div className="rounded-md border bg-muted/10 p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                        {item.description || item.source}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.source}</p>
                </div>
                <Badge variant={item.amount >= 0 ? 'secondary' : 'outline'}>
                    {item.amount.toLocaleString()} credits
                </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
        </div>
    )
}

function itemKey(item: unknown, index: number) {
    if (item && typeof item === 'object' && 'id' in item) return String(item.id)
    return String(index)
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}
