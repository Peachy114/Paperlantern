import { Link } from 'react-router-dom'
import { useState } from 'react'
import { CalendarDays, Eye, Gift, Heart, ImageOff, Layers, MessageCircle, type LucideIcon } from 'lucide-react'
import CommentSection from '@/features/comments/components/CommentSection'
import SuperLikeButton from '@/features/comments/components/SuperLikeButton'
import { storageUrl } from '@/utils/storage'
import type { Art } from '@/types/art'
import type { ArtistProfileResponse, ArtistSticker } from '@/types/artistProfile'
import type { ProfileCanvasDisplay } from '@/features/artist-profile/types/profileEditor'
import { formatProfileDate as formatDate, getArtImages } from '@/features/artist-profile/utils/profileContent'
import { AwardChips } from '@/features/artist-profile/components/ProfileMediaControls'
import { ProfileEmptyPanel as EmptyPanel } from '@/features/artist-profile/components/ProfileFormPrimitives'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Public profile content ----
export function ArtsMasonry({
    arts,
    tileWidth,
    display = 'masonry',
    limit,
    onOpen,
}: {
    arts: Art[]
    tileWidth: number
    display?: ProfileCanvasDisplay
    limit?: number
    onOpen: (art: Art) => void
}) {
    const images = arts
        .flatMap((art) => getArtImages(art).map((image) => ({ art, image })))
        .slice(0, limit)

    if (images.length === 0) {
        return <EmptyPanel icon={ImageOff} text="No public arts yet" />
    }

    if (display === 'standard' || display === 'instagram') {
        return (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {images.map(({ art, image }, index) => (
                    <button
                        type="button"
                        key={`${image.image_path}-${index}`}
                        className="aspect-square overflow-hidden bg-muted"
                        onClick={() => onOpen(art)}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <img
                            src={storageUrl(image.image_path)!}
                            alt={art.title}
                            draggable={false}
                            className="h-full w-full select-none object-cover"
                        />
                    </button>
                ))}
            </div>
        )
    }

    if (display === 'bento') {
        return (
            <div className="grid auto-rows-[96px] grid-cols-4 gap-2 md:grid-cols-6">
                {images.map(({ art, image }, index) => {
                    const span =
                        index % 7 === 0
                            ? 'col-span-2 row-span-2'
                            : index % 7 === 3
                              ? 'col-span-2 row-span-1'
                              : 'col-span-1 row-span-1'

                    return (
                        <button
                            type="button"
                            key={`${image.image_path}-${index}`}
                            className={`${span} overflow-hidden rounded-md bg-muted`}
                            onClick={() => onOpen(art)}
                            onContextMenu={(event) => event.preventDefault()}
                        >
                            <img
                                src={storageUrl(image.image_path)!}
                                alt={art.title}
                                draggable={false}
                                className="h-full w-full select-none object-cover"
                            />
                        </button>
                    )
                })}
            </div>
        )
    }

    if (display === 'magazine') {
        const [lead, ...rest] = images

        return (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                {lead && (
                    <button
                        type="button"
                        className="min-h-[320px] overflow-hidden rounded-md bg-muted"
                        onClick={() => onOpen(lead.art)}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <img
                            src={storageUrl(lead.image.image_path)!}
                            alt={lead.art.title}
                            draggable={false}
                            className="h-full w-full select-none object-cover"
                        />
                    </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                    {rest.map(({ art, image }, index) => (
                        <button
                            type="button"
                            key={`${image.image_path}-${index}`}
                            className="aspect-[4/3] overflow-hidden rounded-md bg-muted"
                            onClick={() => onOpen(art)}
                            onContextMenu={(event) => event.preventDefault()}
                        >
                            <img
                                src={storageUrl(image.image_path)!}
                                alt={art.title}
                                draggable={false}
                                className="h-full w-full select-none object-cover"
                            />
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    if (display === 'gallery') {
        return (
            <div
                className="grid gap-3"
                style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(160, tileWidth)}px, 1fr))`,
                }}
            >
                {images.map(({ art, image }, index) => (
                    <button
                        type="button"
                        key={`${image.image_path}-${index}`}
                        className="aspect-[4/3] overflow-hidden rounded-md bg-muted"
                        onClick={() => onOpen(art)}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <img
                            src={storageUrl(image.image_path)!}
                            alt={art.title}
                            draggable={false}
                            className="h-full w-full select-none object-contain"
                        />
                    </button>
                ))}
            </div>
        )
    }

    if (display === 'carousel') {
        return (
            <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map(({ art, image }, index) => (
                    <button
                        type="button"
                        key={`${image.image_path}-${index}`}
                        className="h-64 w-48 shrink-0 overflow-hidden rounded-md bg-muted"
                        onClick={() => onOpen(art)}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <img
                            src={storageUrl(image.image_path)!}
                            alt={art.title}
                            draggable={false}
                            className="h-full w-full select-none object-cover"
                        />
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div
            className={display === 'pinterest' ? 'gap-3' : 'gap-4'}
            style={{
                columnWidth: display === 'pinterest' ? Math.max(160, tileWidth - 30) : tileWidth,
            }}
        >
            {images.map(({ art, image }, index) => (
                <button
                    type="button"
                    key={`${image.image_path}-${index}`}
                    className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-md bg-muted text-left transition hover:opacity-90"
                    onClick={() => onOpen(art)}
                    onContextMenu={(event) => event.preventDefault()}
                >
                    <img
                        src={storageUrl(image.image_path)!}
                        alt={art.title}
                        draggable={false}
                        className="w-full select-none object-cover"
                    />
                </button>
            ))}
        </div>
    )
}

export function ProfileArtDialog({
    art,
    artist,
    open,
    onOpenChange,
}: {
    art: Art | null
    artist: ArtistProfileResponse['artist']
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    if (!art) return null

    const images = getArtImages(art)
    const imagePaths = images.map((image) => image.image_path).filter(Boolean)
    if (art.image_path && !imagePaths.includes(art.image_path)) imagePaths.push(art.image_path)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="h-[92dvh] !w-[min(96vw,1280px)] !max-w-none overflow-hidden p-0"
                onContextMenu={(event) => event.preventDefault()}
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>{art.title}</DialogTitle>
                    <DialogDescription>Art details</DialogDescription>
                </DialogHeader>
                <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_420px]">
                    <div
                        className="min-h-0 overflow-auto bg-black"
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <ArtViewerImage key={imagePaths.join('|')} paths={imagePaths} alt={art.title} />
                    </div>
                    <aside className="min-h-0 overflow-y-auto border-l bg-background p-5">
                        <h2 className="text-xl font-semibold">{art.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            By <span className="font-medium text-foreground">{artist.name}</span>
                        </p>

                        <div className="mt-4">
                            <SuperLikeButton
                                targetType="art"
                                targetId={art.id}
                                initialCount={art.super_likes_count ?? 0}
                                ownerUserId={artist.id}
                            />
                        </div>

                        {art.description ? (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                {art.description}
                            </p>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">
                                No description added.
                            </p>
                        )}

                        {art.labels && art.labels.length > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                    Labels
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {art.labels.map((label) => (
                                        <span
                                            key={label}
                                            className="rounded-md border px-2 py-1 text-xs text-muted-foreground"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <ProfileArtStat icon={Heart} label="Likes" value={art.likes} />
                            <ProfileArtStat icon={Eye} label="Views" value={art.views} />
                            <ProfileArtStat
                                icon={MessageCircle}
                                label="Comments"
                                value={art.comments_count}
                            />
                            <ProfileArtStat
                                icon={Gift}
                                label="Super likes"
                                value={art.super_likes_count}
                            />
                        </div>

                        <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Posted {formatDate(art.created_at)}
                        </p>

                        <div className="mt-6">
                            <CommentSection
                                targetType="art"
                                targetId={art.id}
                                artistUsername={artist.username}
                                title="Art comments"
                                compact
                            />
                        </div>
                    </aside>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ArtViewerImage({ paths, alt }: { paths: string[]; alt: string }) {
    const [index, setIndex] = useState(0)
    const path = paths[index]
    if (!path) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white/70" role="alert">
                <ImageOff className="h-8 w-8" />
                <p>This artwork image is unavailable. The artist may need to upload it again.</p>
            </div>
        )
    }

    return (
        <img
            src={storageUrl(path)!}
            alt={alt}
            draggable={false}
            className="mx-auto h-full max-h-full max-w-full select-none object-contain"
            onError={() => setIndex((current) => current + 1)}
        />
    )
}

export function ProfileArtStat({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon
    label: string
    value: number
}) {
    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{label}</span>
            </div>
            <p className="mt-1 text-sm font-semibold">{value.toLocaleString()}</p>
        </div>
    )
}

export function WorksGrid({
    works,
    display = 'image_title',
}: {
    works: ArtistProfileResponse['works']
    display?: ProfileCanvasDisplay
}) {
    if (works.length === 0) {
        return <EmptyPanel icon={Layers} text="No public works yet" />
    }

    if (display === 'table') {
        return (
            <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase tracking-widest text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2">Work</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Chapters</th>
                        </tr>
                    </thead>
                    <tbody>
                        {works.map((work) => (
                            <tr key={work.id} className="border-t">
                                <td className="px-3 py-2">
                                    <Link
                                        to={`/works/${work.slug}`}
                                        className="font-medium hover:underline"
                                    >
                                        {work.title}
                                    </Link>
                                </td>
                                <td className="px-3 py-2 capitalize text-muted-foreground">
                                    {work.type === 'wattpad' ? 'novel' : 'webtoon'}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                    {work.chapters_count.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    if (display === 'split_card') {
        return (
            <div className="grid gap-3">
                {works.map((work) => (
                    <Link
                        key={work.id}
                        to={`/works/${work.slug}`}
                        className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-md border bg-background p-2 transition hover:bg-muted/30"
                    >
                        <div className="aspect-[3/4] overflow-hidden rounded bg-muted">
                            {work.cover ? (
                                <img
                                    src={storageUrl(work.cover)!}
                                    alt={work.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                    No Cover
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 py-1">
                            <p className="line-clamp-2 font-semibold">{work.title}</p>
                            <p className="mt-1 text-xs capitalize text-muted-foreground">
                                {work.type === 'wattpad' ? 'novel' : 'webtoon'}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {work.chapters_count.toLocaleString()} chapters
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {works.map((work) => (
                <Link key={work.id} to={`/works/${work.slug}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                        {work.cover ? (
                            <img
                                src={storageUrl(work.cover)!}
                                alt={work.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                No Cover
                            </div>
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded bg-[var(--comix-badge-type)] px-2 py-0.5 text-[10px] font-semibold capitalize text-white">
                            {work.type === 'wattpad' ? 'novel' : 'webtoon'}
                        </span>
                    </div>
                    {display !== 'image' && (
                        <>
                            <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug">
                                {work.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {work.chapters_count.toLocaleString()} chapters
                            </p>
                        </>
                    )}
                </Link>
            ))}
        </div>
    )
}

export function ProfileStickers({
    stickers,
    stickerSize,
}: {
    stickers: ArtistSticker[]
    stickerSize: number
}) {
    if (stickers.length === 0) {
        return <EmptyPanel icon={Layers} text="No stickers yet" />
    }

    return (
        <div
            className="grid gap-4"
            style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${stickerSize}px, 1fr))`,
            }}
        >
            {stickers.map((sticker) => (
                <div key={sticker.id} className="group text-center">
                    <div
                        className="mx-auto flex max-w-full items-center justify-center"
                        style={{ height: stickerSize, width: stickerSize }}
                    >
                        <img
                            src={storageUrl(sticker.image_path)!}
                            alt={sticker.name}
                            className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                        />
                    </div>
                    <p className="mt-2 truncate text-xs text-muted-foreground">{sticker.name}</p>
                </div>
            ))}
        </div>
    )
}

export function ProfileShopCards({
    items,
}: {
    items: NonNullable<ArtistProfileResponse['shop']>
}) {
    if (items.length === 0) return <EmptyPanel icon={Gift} text="No shop items yet" />

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((item) => (
                <article key={item.id} data-profile-card className="overflow-hidden rounded-xl border bg-card">
                    <div className="aspect-square overflow-hidden bg-muted">
                        {item.image_path ? (
                            <img src={storageUrl(item.image_path)!} alt={item.title} className="h-full w-full object-cover transition-transform hover:scale-105" />
                        ) : (
                            <div className="grid h-full place-items-center text-muted-foreground"><ImageOff className="h-8 w-8" /></div>
                        )}
                    </div>
                    <div className="space-y-1 p-3">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="text-xs capitalize text-muted-foreground">{item.type.replaceAll('_', ' ')}</p>
                        <p className="text-xs font-semibold">{item.download_policy === 'paid' ? `${item.credit_cost} credits` : 'Free'}</p>
                    </div>
                </article>
            ))}
        </div>
    )
}

export function ProfileComments({
    comments,
    variant = 'cards',
}: {
    comments: NonNullable<ArtistProfileResponse['comments']>
    variant?: 'cards' | 'table'
}) {
    if (comments.length === 0) {
        return <EmptyPanel icon={MessageCircle} text="No public comments highlighted yet" />
    }

    if (variant === 'table') {
        return (
            <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase tracking-widest text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2">Origin</th>
                            <th className="px-3 py-2">Comment</th>
                            <th className="px-3 py-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comments.map((comment) => (
                            <tr key={comment.id} className="border-t align-top">
                                <td className="px-3 py-2">
                                    <span className="block text-xs capitalize text-muted-foreground">
                                        {comment.origin.type}
                                    </span>
                                    {comment.origin.href ? (
                                        <Link
                                            to={comment.origin.href}
                                            className="font-medium hover:underline"
                                        >
                                            {comment.origin.title}
                                        </Link>
                                    ) : (
                                        <span className="font-medium">{comment.origin.title}</span>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                    {comment.body || comment.sticker?.name || 'Sticker'}
                                    {comment.awards && comment.awards.length > 0 && (
                                        <AwardChips awards={comment.awards} />
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                                    {formatDate(comment.created_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {comments.map((comment) => {
                const card = (
                    <article className="rounded-lg border bg-background p-4 transition hover:bg-muted/30">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                {comment.origin.type}
                            </span>
                            <h3 className="truncate text-sm font-semibold">
                                {comment.origin.title}
                            </h3>
                        </div>

                        {comment.body && (
                            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                {comment.body}
                            </p>
                        )}

                        {comment.sticker && (
                            <div className="mt-3 h-24 w-24 rounded-md bg-muted/20 p-2">
                                <img
                                    src={storageUrl(comment.sticker.image_path)!}
                                    alt={comment.sticker.name}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        )}

                        {comment.awards && comment.awards.length > 0 && (
                            <AwardChips awards={comment.awards} />
                        )}

                        <p className="mt-3 text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                        </p>
                    </article>
                )

                return comment.origin.href ? (
                    <Link key={comment.id} to={comment.origin.href} className="block">
                        {card}
                    </Link>
                ) : (
                    <div key={comment.id}>{card}</div>
                )
            })}
        </div>
    )
}
