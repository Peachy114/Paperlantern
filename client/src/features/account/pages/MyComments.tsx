import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { accountApi, type AccountComment } from '@/api/account'
import { storageUrl } from '@/utils/storage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function MyComments() {
    const queryClient = useQueryClient()
    const { data, isLoading } = useQuery({
        queryKey: ['account-comments'],
        queryFn: () => accountApi.comments().then((res) => res.data.data),
    })

    const highlightMutation = useMutation({
        mutationFn: ({ id, value }: { id: string; value: boolean }) =>
            accountApi.setCommentHighlight(id, value).then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['account-comments'] })
            toast.success('Comment visibility updated.')
        },
        onError: () => toast.error('Could not update comment visibility.'),
    })

    const comments = data ?? []

    return (
        <main className="mx-auto max-w-[1100px] px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">My Comments</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage comments you made on webtoons, novels, chapters, and arts.
                </p>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton key={index} className="h-32 rounded-lg" />
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <div className="rounded-lg border py-16 text-center">
                    <MessageCircle className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            busy={highlightMutation.isPending}
                            onToggle={(value) =>
                                highlightMutation.mutate({ id: comment.id, value })
                            }
                        />
                    ))}
                </div>
            )}
        </main>
    )
}

function CommentCard({
    comment,
    busy,
    onToggle,
}: {
    comment: AccountComment
    busy: boolean
    onToggle: (value: boolean) => void
}) {
    return (
        <article className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                            {comment.origin.type}
                        </Badge>
                        <h2 className="truncate text-sm font-semibold">{comment.origin.title}</h2>
                    </div>
                    {comment.origin.subtitle && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {comment.origin.subtitle}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                    {comment.origin.href && (
                        <Button type="button" size="sm" variant="outline" asChild>
                            <Link to={comment.origin.href}>Open Origin</Link>
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant={comment.public_highlight ? 'default' : 'outline'}
                        disabled={busy}
                        onClick={() => onToggle(!comment.public_highlight)}
                    >
                        {comment.public_highlight ? 'Public Highlight' : 'Highlight'}
                    </Button>
                </div>
            </div>

            {comment.body && <p className="whitespace-pre-wrap text-sm leading-6">{comment.body}</p>}

            {comment.sticker && (
                <div className="mt-3 h-24 w-24 rounded-md bg-muted/20 p-2">
                    <img
                        src={storageUrl(comment.sticker.image_path)!}
                        alt={comment.sticker.name}
                        className="h-full w-full object-contain"
                    />
                </div>
            )}

            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatDate(comment.created_at)}</span>
                <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {comment.super_likes_count.toLocaleString()}
                </span>
            </div>
        </article>
    )
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}
