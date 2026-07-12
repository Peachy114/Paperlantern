import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Eye, Heart, ImageOff } from 'lucide-react'
import { accountApi } from '@/api/account'
import { storageUrl } from '@/utils/storage'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function Favorites() {
    const { data, isLoading } = useQuery({
        queryKey: ['account-favorites'],
        queryFn: () => accountApi.favorites().then((res) => res.data.data),
    })

    const favorites = data ?? []

    return (
        <main className="mx-auto max-w-[1360px] px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Your favorite webtoons and novels.
                </p>
            </div>

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Skeleton key={index} className="h-44 rounded-lg" />
                    ))}
                </div>
            ) : favorites.length === 0 ? (
                <EmptyState text="No favorites yet" />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {favorites.map(({ id, work }) => (
                        <Link
                            key={id}
                            to={`/works/${work.slug}`}
                            className="group flex gap-3 rounded-lg border bg-background p-3 transition hover:bg-muted/30"
                        >
                            <div className="h-36 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                                {work.cover ? (
                                    <img
                                        src={storageUrl(work.cover)!}
                                        alt={work.title}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <ImageOff className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <Badge variant="secondary" className="capitalize">
                                    {work.type === 'wattpad' ? 'novel' : 'webtoon'}
                                </Badge>
                                <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">
                                    {work.title}
                                </h2>
                                {work.author && (
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                        By {work.author.name}
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" />
                                        {work.views.toLocaleString()}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Heart className="h-3.5 w-3.5" />
                                        {work.likes.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    )
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-lg border py-16 text-center">
            <BookOpen className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    )
}
