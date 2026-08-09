import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Gift, Heart, ImageOff, Lock, MessageCircle, MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreatePostDialog, FeedPostCard } from '@/features/feeds/pages/Feeds'
import { storageUrl } from '@/utils/storage'
import type { ArtistProfileResponse, ProfileCanvasItem } from '@/types/artistProfile'

// Profile feed presentation ----
export function ProfileDashboardWidgets({ profile }: { profile: ArtistProfileResponse }) {
    const stats = profile.stats
    const items = [
        { label: 'Works', value: stats?.works_total ?? profile.works.length },
        { label: 'Arts', value: stats?.arts_total ?? profile.arts.length },
        { label: 'Followers', value: stats?.followers_count ?? 0 },
        { label: 'Feeds', value: stats?.feed_posts_count ?? profile.feeds?.length ?? 0 },
    ]

    return (
        <section className="mb-5 grid gap-3 sm:grid-cols-4">
            {items.map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
            ))}
        </section>
    )
}

export function ProfileFeeds({
    feeds,
    canCreate = false,
    display = 'cards',
}: {
    feeds: NonNullable<ArtistProfileResponse['feeds']>
    canCreate?: boolean
    display?: ProfileCanvasItem['display']
}) {
    const MAX_PROFILE_FEEDS = 30
    const FEEDS_PER_LOAD = 5
    const [feedItems, setFeedItems] = useState(feeds)
    const [createOpen, setCreateOpen] = useState(false)
    const availableFeeds = feedItems.slice(0, MAX_PROFILE_FEEDS)
    const [visibleCount, setVisibleCount] = useState(
        Math.min(FEEDS_PER_LOAD, availableFeeds.length)
    )

    useEffect(() => {
        setFeedItems(feeds)
    }, [feeds])

    useEffect(() => {
        setVisibleCount((current) =>
            Math.min(
                Math.max(Math.min(current, availableFeeds.length), FEEDS_PER_LOAD),
                availableFeeds.length
            )
        )
    }, [availableFeeds.length])

    if (availableFeeds.length === 0) {
        return (
            <>
                {canCreate && (
                    <div className="mb-4 flex justify-end">
                        <Button onClick={() => setCreateOpen(true)}>Create post</Button>
                    </div>
                )}
                <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
                    <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <h3 className="font-semibold">No feed posts yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Published feed posts will appear here.
                    </p>
                </div>
                <CreatePostDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onCreated={(post) => setFeedItems((current) => [post, ...current])}
                />
            </>
        )
    }

    const compact = display === 'compact'
    const visibleFeeds = availableFeeds.slice(0, visibleCount)
    const hasMore = visibleCount < availableFeeds.length
    const remaining = availableFeeds.length - visibleCount

    return (
        <div className="w-full">
            {canCreate && (
                <div className="mb-4 flex justify-end">
                    <Button onClick={() => setCreateOpen(true)}>Create post</Button>
                </div>
            )}
            <div className={compact ? 'space-y-3' : 'mx-auto grid max-w-4xl gap-5'}>
                {visibleFeeds.map((post) => (
                    <FeedPostCard
                        key={post.id}
                        post={post}
                        compact={compact}
                        onChange={(nextPost) =>
                            setFeedItems((current) =>
                                current.map((item) => (item.id === nextPost.id ? nextPost : item))
                            )
                        }
                        onDelete={(postId) =>
                            setFeedItems((current) => current.filter((item) => item.id !== postId))
                        }
                    />
                ))}
            </div>

            {hasMore && (
                <div className="mt-6 flex justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            setVisibleCount((current) =>
                                Math.min(current + FEEDS_PER_LOAD, availableFeeds.length)
                            )
                        }
                    >
                        <Plus className="h-4 w-4" />
                        Load more
                        <span className="text-muted-foreground">
                            ({Math.min(FEEDS_PER_LOAD, remaining)} more)
                        </span>
                    </Button>
                </div>
            )}

            <p className="mt-3 text-center text-xs text-muted-foreground">
                Showing {visibleFeeds.length} of {availableFeeds.length} posts
            </p>
            <CreatePostDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={(post) => setFeedItems((current) => [post, ...current])}
            />
        </div>
    )
}

export function ProfileFeedCard({
    post,
    compact = false,
}: {
    post: NonNullable<ArtistProfileResponse['feeds']>[number]
    compact?: boolean
}) {
    const avatar = post.user?.avatar ? storageUrl(post.user.avatar) : null
    const displayName = post.user?.name ?? post.user?.username ?? 'Artist'
    const avatarLetter = displayName[0]?.toUpperCase() ?? 'A'

    return (
        <article
            className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${
                compact ? 'p-4' : ''
            }`}
        >
            <div className={compact ? '' : 'p-4 sm:p-5'}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold">
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt={displayName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                avatarLetter
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="flex items-center gap-1 truncate text-sm font-semibold">
                                {displayName}
                                {post.user?.artist_verified && (
                                    <BadgeCheck className="h-4 w-4 shrink-0 text-sky-500" />
                                )}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>@{post.user?.username ?? 'artist'}</span>
                                <span>•</span>
                                <time dateTime={String(post.created_at)}>
                                    {formatFeedDate(post.created_at)}
                                </time>
                                {post.audience === 'followers' && (
                                    <>
                                        <span>•</span>
                                        <Lock className="h-3 w-3" aria-label="Followers only" />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <MoreHorizontal className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>

                {post.body && (
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">
                        {post.body}
                    </p>
                )}

                {post.sticker && (
                    <img
                        src={storageUrl(post.sticker.image_path)!}
                        alt={post.sticker.name}
                        className="mt-4 h-28 w-28 object-contain"
                    />
                )}

                {post.attachment && (
                    <Link
                        to={post.attachment.href}
                        className="mt-4 flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                    >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                            {post.attachment.image_path ? (
                                <img
                                    src={storageUrl(post.attachment.image_path)!}
                                    alt={post.attachment.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <ImageOff className="m-auto h-full w-6 text-muted-foreground" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                                {post.attachment.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {post.attachment.subtitle}
                            </p>
                        </div>
                    </Link>
                )}
            </div>

            {post.images.length > 0 && !compact && <ProfileFeedImages post={post} />}

            {post.images.length > 0 && compact && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {post.images.slice(0, 4).map((image) => (
                        <img
                            key={image.id}
                            src={storageUrl(image.image_path)!}
                            alt="Feed attachment"
                            className="h-24 w-24 shrink-0 rounded-md object-cover"
                        />
                    ))}
                </div>
            )}

            <div
                className={`flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border text-sm text-muted-foreground ${
                    compact ? 'mt-4 pt-3' : 'px-4 py-3 sm:px-5'
                }`}
            >
                <span className="inline-flex items-center gap-1.5">
                    <Heart className="h-4 w-4" />
                    {post.likes_count.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments_count.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Gift className="h-4 w-4" />
                    {post.super_likes_count.toLocaleString()}
                </span>
            </div>
        </article>
    )
}

export function ProfileFeedImages({
    post,
}: {
    post: NonNullable<ArtistProfileResponse['feeds']>[number]
}) {
    const images = post.images.slice(0, 4)
    const extra = Math.max(0, post.images.length - images.length)

    return (
        <div
            className={`grid gap-0.5 bg-border ${
                images.length === 1
                    ? 'grid-cols-1'
                    : images.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2'
            }`}
        >
            {images.map((image, index) => (
                <div
                    key={image.id}
                    className={`relative overflow-hidden bg-muted ${
                        images.length === 1
                            ? 'aspect-video max-h-[560px]'
                            : images.length === 3 && index === 0
                              ? 'row-span-2 min-h-80'
                              : 'aspect-square'
                    }`}
                >
                    <img
                        src={storageUrl(image.image_path)!}
                        alt={`Feed image ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                    {extra > 0 && index === images.length - 1 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-2xl font-bold text-white">
                            +{extra}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export function formatFeedDate(value: string | Date) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
    }).format(date)
}

