import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
    BadgeCheck,
    ChevronLeft,
    Edit3,
    Heart,
    Image as ImageIcon,
    MessageCircle,
    MoreHorizontal,
    Paperclip,
    Settings2,
    Smile,
    StickyNote,
    Trash2,
    X,
} from 'lucide-react'
import { feedsApi, type FeedPost } from '@/api/feeds'
import { artistProfileApi } from '@/api/artistProfile'
import { studioApi } from '@/api/studio'
import { useAuthStore } from '@/store/authStore'
import { storageUrl } from '@/utils/storage'
import CommentSection from '@/features/comments/components/CommentSection'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'

const EMOJIS = ['👍', '😀', '😘', '😍', '😆', '😜', '😅', '😂', '😱', '🔥', '❤️', '✨']

type StickerOption = { id: string; name: string; image_path: string }
type AttachOption = {
    id: string
    title: string
    subtitle: string
    image_path?: string | null
    type: 'work' | 'art'
}

export default function Feeds() {
    const [posts, setPosts] = useState<FeedPost[]>([])
    const [open, setOpen] = useState(false)

    const load = async () => {
        const res = await feedsApi.index()
        setPosts(res.data.data ?? [])
    }

    useEffect(() => {
        load().catch(() => toast.error('Could not load feeds.'))
    }, [])

    return (
        <main className="mx-auto max-w-4xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Feeds</h1>
                    <p className="text-sm text-muted-foreground">
                        Posts from you and creators you follow.
                    </p>
                </div>
                <Button onClick={() => setOpen(true)}>Create post</Button>
            </div>

            <FeedPostList posts={posts} onPostsChange={setPosts} />

            <CreatePostDialog
                open={open}
                onOpenChange={setOpen}
                onCreated={(post) => setPosts((current) => [post, ...current])}
            />
        </main>
    )
}

export function FeedPostList({
    posts,
    onPostsChange,
    compact = false,
}: {
    posts: FeedPost[]
    onPostsChange?: (posts: FeedPost[]) => void
    compact?: boolean
}) {
    const handleChange = (next: FeedPost) => {
        onPostsChange?.(posts.map((post) => (post.id === next.id ? next : post)))
    }

    const handleDelete = (postId: string) => {
        onPostsChange?.(posts.filter((post) => post.id !== postId))
    }

    if (posts.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No feed posts yet.
            </div>
        )
    }

    return (
        <div className={compact ? 'space-y-3' : 'space-y-5'}>
            {posts.map((post) => (
                <FeedPostCard
                    key={post.id}
                    post={post}
                    compact={compact}
                    onChange={handleChange}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    )
}

export function FeedPostCard({
    post,
    compact = false,
    onChange,
    onDelete,
}: {
    post: FeedPost
    compact?: boolean
    onChange?: (post: FeedPost) => void
    onDelete?: (postId: string) => void
}) {
    const user = useAuthStore((state) => state.user)
    const [localPost, setLocalPost] = useState(post)
    const [showComments, setShowComments] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [viewerImage, setViewerImage] = useState<string | null>(null)
    const isOwner = localPost.can_manage || user?.id === localPost.user.id
    const avatar = localPost.user.avatar ? storageUrl(localPost.user.avatar) : null

    useEffect(() => setLocalPost(post), [post])

    const updatePost = (next: FeedPost) => {
        setLocalPost(next)
        onChange?.(next)
    }

    const toggleLike = async () => {
        try {
            const res = await feedsApi.like(localPost.id)
            updatePost({
                ...localPost,
                liked_by_me: res.data.liked,
                likes_count: res.data.likes_count,
            })
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Could not update like.')
        }
    }

    const deletePost = async () => {
        if (!window.confirm('Delete this feed post?')) return
        try {
            await feedsApi.delete(localPost.id)
            onDelete?.(localPost.id)
            toast.success('Feed post deleted.')
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Could not delete feed post.')
        }
    }

    return (
        <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className={compact ? 'p-4' : 'p-4 sm:p-5'}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            to={`/artists/${localPost.user.username}`}
                            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold"
                        >
                            {avatar ? (
                                <img src={avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                                localPost.user.name[0]
                            )}
                        </Link>
                        <div className="min-w-0">
                            <p className="flex items-center gap-1 truncate text-sm font-semibold">
                                {localPost.user.name}
                                {localPost.user.artist_verified && (
                                    <BadgeCheck className="h-4 w-4 shrink-0 text-sky-500" />
                                )}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>@{localPost.user.username}</span>
                                <span>-</span>
                                <time dateTime={String(localPost.created_at)}>
                                    {formatFeedDate(localPost.created_at)}
                                </time>
                            </div>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Feed post menu">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {isOwner ? (
                                <>
                                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                        <Edit3 className="h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onClick={deletePost}>
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                                    Report
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {localPost.body && (
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">
                        {localPost.body}
                    </p>
                )}

                <FeedAttachments attachments={localPost.attachments?.length ? localPost.attachments : localPost.attachment ? [localPost.attachment] : []} />
            </div>

            {localPost.sticker && (
                <div className="px-4 pb-4 sm:px-5">
                    <img
                        src={storageUrl(localPost.sticker.image_path)!}
                        alt={localPost.sticker.name}
                        className="h-28 w-28 object-contain"
                    />
                </div>
            )}

            {localPost.images.length > 0 && <FeedImages post={localPost} compact={compact} onOpenImage={setViewerImage} />}

            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground sm:px-5">
                <div className="flex items-center gap-5">
                    <button
                        type="button"
                        onClick={toggleLike}
                        className={`inline-flex items-center gap-1.5 transition hover:text-foreground ${
                            localPost.liked_by_me ? 'text-rose-500' : ''
                        }`}
                    >
                        <Heart
                            className={localPost.liked_by_me ? 'h-4 w-4 fill-current' : 'h-4 w-4'}
                        />
                        {localPost.likes_count.toLocaleString()}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowComments((current) => !current)}
                        className="inline-flex items-center gap-1.5 transition hover:text-foreground"
                    >
                        <MessageCircle className="h-4 w-4" />
                        {localPost.comments_count.toLocaleString()}
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="border-t border-border px-4 py-4 sm:px-5">
                    {localPost.comments_enabled ? (
                        <CommentSection
                            targetType="feed"
                            targetId={localPost.id}
                            title="Feed comments"
                            compact
                            artistUsername={localPost.user.username}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Comments are disabled for this post.
                        </p>
                    )}
                </div>
            )}

            <EditFeedDialog
                post={localPost}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSaved={updatePost}
            />
            <ReportFeedDialog post={localPost} open={reportOpen} onOpenChange={setReportOpen} />
            <ImageViewer image={viewerImage} onClose={() => setViewerImage(null)} />
        </article>
    )
}

function FeedAttachments({
    attachments,
}: {
    attachments: NonNullable<FeedPost['attachments']>
}) {
    if (attachments.length === 0) return null

    return (
        <div className="mt-4 grid gap-2">
            {attachments.map((attachment) => (
                <Link
                    key={`${attachment.type}-${attachment.id}`}
                    to={attachment.href}
                    className="flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/50"
                >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                        {attachment.image_path && (
                            <img
                                src={storageUrl(attachment.image_path)!}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{attachment.title}</p>
                        <p className="text-xs text-muted-foreground">{attachment.subtitle}</p>
                    </div>
                </Link>
            ))}
        </div>
    )
}

function FeedImages({
    post,
    compact,
    onOpenImage,
}: {
    post: FeedPost
    compact?: boolean
    onOpenImage: (image: string) => void
}) {
    const images = post.images.slice(0, 4)
    const extra = Math.max(0, post.images.length - images.length)

    return (
        <div
            className={`grid gap-0.5 bg-border ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
        >
            {images.map((image, index) => (
                <div
                    key={image.id}
                    className={`relative overflow-hidden bg-muted ${
                        images.length === 1
                            ? compact
                                ? 'aspect-video'
                                : 'aspect-video max-h-[560px]'
                            : images.length === 3 && index === 0
                              ? 'row-span-2 min-h-72'
                              : 'aspect-square'
                    }`}
                >
                    <button type="button" className="h-full w-full" onClick={() => onOpenImage(storageUrl(image.image_path)!)}>
                        <img
                            src={storageUrl(image.image_path)!}
                            alt={`Feed image ${index + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    </button>
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

function EditFeedDialog({
    post,
    open,
    onOpenChange,
    onSaved,
}: {
    post: FeedPost
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved: (post: FeedPost) => void
}) {
    const [body, setBody] = useState(post.body ?? '')
    const [audience, setAudience] = useState<'all' | 'followers'>(post.audience)
    const [commentsEnabled, setCommentsEnabled] = useState(post.comments_enabled)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        setBody(post.body ?? '')
        setAudience(post.audience)
        setCommentsEnabled(post.comments_enabled)
    }, [open, post])

    const save = async () => {
        setSaving(true)
        try {
            const res = await feedsApi.update(post.id, {
                body,
                audience,
                comments_enabled: commentsEnabled,
            })
            onSaved(res.data)
            onOpenChange(false)
            toast.success('Feed post updated.')
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Could not update feed post.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit feed post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Textarea
                        value={body}
                        maxLength={1000}
                        onChange={(event) => setBody(event.target.value)}
                    />
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <label className="flex items-center gap-2">
                            Audience
                            <select
                                className="rounded-md border bg-background px-2 py-1"
                                value={audience}
                                onChange={(event) =>
                                    setAudience(event.target.value as 'all' | 'followers')
                                }
                            >
                                <option value="all">All</option>
                                <option value="followers">Followers</option>
                            </select>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={commentsEnabled}
                                onChange={(event) => setCommentsEnabled(event.target.checked)}
                            />
                            Enable comments
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={save} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ReportFeedDialog({
    post,
    open,
    onOpenChange,
}: {
    post: FeedPost
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [reason, setReason] = useState('')
    const [details, setDetails] = useState('')
    const [sending, setSending] = useState(false)

    const submit = async () => {
        setSending(true)
        try {
            const res = await feedsApi.report(post.id, { reason, details })
            toast.success(`Report sent. Support #${res.data.support_number}`)
            setReason('')
            setDetails('')
            onOpenChange(false)
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Could not send report.')
        } finally {
            setSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Report feed post</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <input
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Reason"
                        className="w-full rounded-md border bg-background px-3 py-2"
                    />
                    <Textarea
                        value={details}
                        onChange={(event) => setDetails(event.target.value)}
                        placeholder="Details"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submit} disabled={!reason.trim() || sending}>
                            {sending ? 'Sending...' : 'Send report'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function CreatePostDialog({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: (post: FeedPost) => void
}) {
    const [body, setBody] = useState('')
    const [audience, setAudience] = useState<'all' | 'followers'>('all')
    const [commentsEnabled, setCommentsEnabled] = useState(true)
    const [images, setImages] = useState<File[]>([])
    const [stickers, setStickers] = useState<StickerOption[]>([])
    const [selectedSticker, setSelectedSticker] = useState<StickerOption | null>(null)
    const [attachments, setAttachments] = useState<AttachOption[]>([])
    const [selectedAttachments, setSelectedAttachments] = useState<AttachOption[]>([])
    const [viewerImage, setViewerImage] = useState<string | null>(null)
    const [panel, setPanel] = useState<
        'none' | 'emoji' | 'stickers' | 'attach' | 'settings' | 'rules'
    >('none')
    const [submitting, setSubmitting] = useState(false)
    const previews = useMemo(() => images.map((image) => URL.createObjectURL(image)), [images])
    const hasImages = images.length > 0
    const hasSticker = Boolean(selectedSticker)
    const hasAttachments = selectedAttachments.length > 0
    const activeMediaTypes = [hasImages, hasSticker, hasAttachments].filter(Boolean).length

    useEffect(() => {
        return () => previews.forEach((url) => URL.revokeObjectURL(url))
    }, [previews])

    useEffect(() => {
        if (!open) return
        artistProfileApi
            .stickerLibrary()
            .then((res) => {
                const all = res.data.data
                    ? res.data.data
                    : [...(res.data.owned ?? []), ...(res.data.subscribed ?? []), ...(res.data.bought ?? [])]
                setStickers(all)
            })
            .catch(() => undefined)

        Promise.allSettled([studioApi.getWorks(), studioApi.getArts()]).then(([works, arts]) => {
            const options: AttachOption[] = []
            if (works.status === 'fulfilled') {
                options.push(
                    ...(works.value.data ?? []).map((work: any) => ({
                        id: work.id,
                        title: work.title,
                        subtitle: work.type === 'wattpad' ? 'Novel' : 'Webtoon',
                        image_path: work.cover,
                        type: 'work' as const,
                    }))
                )
            }
            if (arts.status === 'fulfilled') {
                const artsPayload = arts.value.data
                const artItems = Array.isArray(artsPayload)
                    ? artsPayload
                    : Array.isArray(artsPayload?.data)
                      ? artsPayload.data
                      : []
                options.push(
                    ...artItems.map((art: any) => ({
                        id: art.id,
                        title: art.title,
                        subtitle: 'Art',
                        image_path: art.images?.[0]?.image_path,
                        type: 'art' as const,
                    }))
                )
            }
            setAttachments(options)
        })
    }, [open])

    const reset = () => {
        setBody('')
        setImages([])
        setSelectedSticker(null)
        setSelectedAttachments([])
        setPanel('none')
    }

    const submit = async () => {
        setSubmitting(true)
        try {
            const form = new FormData()
            form.append('body', body)
            form.append('audience', audience)
            form.append('comments_enabled', commentsEnabled ? '1' : '0')
            images.forEach((image) => form.append('images[]', image))
            if (selectedSticker) form.append('sticker_id', selectedSticker.id)
            selectedAttachments
                .filter((item) => item.type === 'work')
                .forEach((item) => form.append('attached_work_ids[]', item.id))
            selectedAttachments
                .filter((item) => item.type === 'art')
                .forEach((item) => form.append('attached_art_ids[]', item.id))
            const res = await feedsApi.create(form)
            onCreated(res.data)
            reset()
            onOpenChange(false)
            toast.success('Post created.')
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Could not create post.')
        } finally {
            setSubmitting(false)
        }
    }

    const disabledHint = 'Remove the current attachment type before choosing another.'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="h-dvh !w-screen !max-w-none rounded-none bg-background p-0 sm:!max-w-none"
                aria-describedby={undefined}
            >
                <div className="flex h-full flex-col">
                    <DialogHeader className="border-b px-5 py-3">
                        <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                                <ChevronLeft />
                            </Button>
                            <DialogTitle className="text-center">Create Post</DialogTitle>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setPanel(panel === 'settings' ? 'none' : 'settings')
                                    }
                                >
                                    <Settings2 />
                                </Button>
                                <Button disabled={submitting} onClick={submit}>
                                    {submitting ? 'Posting...' : 'Post'}
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-6">
                        <Textarea
                            value={body}
                            maxLength={1000}
                            onChange={(event) => setBody(event.target.value)}
                            placeholder="Share recent updates with your followers."
                            className="min-h-48 flex-1 resize-none border-0 bg-transparent p-0 text-lg shadow-none focus-visible:ring-0"
                        />

                        <div className="mt-4 flex flex-wrap gap-3">
                            {selectedSticker && (
                                <SelectedPreview onRemove={() => setSelectedSticker(null)}>
                                    <img
                                        src={storageUrl(selectedSticker.image_path)!}
                                        className="h-24 w-24 object-contain"
                                    />
                                </SelectedPreview>
                            )}
                            {previews.map((src, index) => (
                                <SelectedPreview
                                    key={src}
                                    onRemove={() =>
                                        setImages((current) =>
                                            current.filter((_, i) => i !== index)
                                        )
                                    }
                                >
                                    <button type="button" onClick={() => setViewerImage(src)}>
                                        <img src={src} className="h-24 w-32 rounded-md object-cover" />
                                    </button>
                                </SelectedPreview>
                            ))}
                            {selectedAttachments.map((selectedAttachment) => (
                                <SelectedPreview
                                    key={`${selectedAttachment.type}-${selectedAttachment.id}`}
                                    onRemove={() =>
                                        setSelectedAttachments((current) =>
                                            current.filter((item) => `${item.type}-${item.id}` !== `${selectedAttachment.type}-${selectedAttachment.id}`)
                                        )
                                    }
                                >
                                    <div className="flex w-96 max-w-full items-center gap-3 rounded-lg border bg-muted/30 p-2">
                                        <div className="h-16 w-16 overflow-hidden rounded bg-muted">
                                            {selectedAttachment.image_path && (
                                                <img
                                                    src={storageUrl(selectedAttachment.image_path)!}
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">
                                                {selectedAttachment.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedAttachment.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                </SelectedPreview>
                            ))}
                        </div>

                        {panel !== 'none' && (
                            <FloatingPanel
                                panel={panel}
                                setPanel={setPanel}
                                body={body}
                                setBody={setBody}
                                stickers={stickers}
                                setSelectedSticker={setSelectedSticker}
                                attachments={attachments}
                                selectedAttachments={selectedAttachments}
                                setSelectedAttachments={setSelectedAttachments}
                                audience={audience}
                                setAudience={setAudience}
                                commentsEnabled={commentsEnabled}
                                setCommentsEnabled={setCommentsEnabled}
                            />
                        )}
                    </div>

                    <div className="border-t px-5 py-3">
                        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setPanel(panel === 'emoji' ? 'none' : 'emoji')}
                                >
                                    <Smile />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={!hasSticker && activeMediaTypes >= 2}
                                    title={
                                        !hasSticker && activeMediaTypes >= 2
                                            ? disabledHint
                                            : 'Choose sticker'
                                    }
                                    onClick={() =>
                                        setPanel(panel === 'stickers' ? 'none' : 'stickers')
                                    }
                                >
                                    <StickyNote />
                                </Button>
                                <label
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                                        !hasImages && activeMediaTypes >= 2
                                            ? 'pointer-events-none opacity-50'
                                            : 'cursor-pointer hover:bg-muted'
                                    }`}
                                    title={
                                        !hasImages && activeMediaTypes >= 2
                                            ? disabledHint
                                            : 'Upload images'
                                    }
                                >
                                    <ImageIcon className="h-4 w-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="sr-only"
                                        onChange={(event) =>
                                            setImages((current) =>
                                                [
                                                    ...current,
                                                    ...Array.from(event.target.files ?? []),
                                                ].slice(0, 10)
                                            )
                                        }
                                    />
                                </label>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={!hasAttachments && activeMediaTypes >= 2}
                                    title={
                                        !hasAttachments && activeMediaTypes >= 2
                                            ? disabledHint
                                            : 'Attach work or art'
                                    }
                                    onClick={() => setPanel(panel === 'attach' ? 'none' : 'attach')}
                                >
                                    <Paperclip />
                                </Button>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">
                                    {body.length}/1000
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <ImageViewer image={viewerImage} onClose={() => setViewerImage(null)} />
            </DialogContent>
        </Dialog>
    )
}

function SelectedPreview({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
    return (
        <div className="relative">
            {children}
            <button
                type="button"
                className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background"
                onClick={onRemove}
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    )
}

function FloatingPanel(props: any) {
    if (props.panel === 'rules') {
        return (
            <Dialog open onOpenChange={(open) => !open && props.setPanel('none')}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Community Guidelines</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            No spam, unsafe content, personal information, harassment, or hateful
                            content.
                        </p>
                        <p>
                            Posts may be removed and accounts may be reviewed when rules are broken.
                        </p>
                    </div>
                    <Button onClick={() => props.setPanel('none')}>OK</Button>
                </DialogContent>
            </Dialog>
        )
    }
    if (props.panel === 'settings') {
        return (
            <div className="absolute right-5 top-5 z-10 w-72 rounded-lg border bg-popover p-4 shadow-xl">
                <label className="flex items-center justify-between text-sm">
                    <span>Audience</span>
                    <select
                        className="rounded border bg-background px-2 py-1"
                        value={props.audience}
                        onChange={(e) => props.setAudience(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="followers">Followers</option>
                    </select>
                </label>
                <label className="mt-3 flex items-center justify-between text-sm">
                    <span>Enable comments</span>
                    <input
                        type="checkbox"
                        checked={props.commentsEnabled}
                        onChange={(e) => props.setCommentsEnabled(e.target.checked)}
                    />
                </label>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => props.setPanel('rules')}
                >
                    Rules
                </Button>
            </div>
        )
    }
    if (props.panel === 'emoji') {
        return (
            <div className="absolute bottom-5 left-5 z-10 grid w-80 grid-cols-6 gap-3 rounded-lg border bg-popover p-4 text-2xl shadow-xl">
                {EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => props.setBody((body: string) => `${body}${emoji}`)}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        )
    }
    if (props.panel === 'stickers') {
        return (
            <div className="absolute bottom-5 left-16 z-10 grid max-h-80 w-96 grid-cols-4 gap-3 overflow-auto rounded-lg border bg-popover p-4 shadow-xl">
                {props.stickers.map((sticker: StickerOption) => (
                    <button
                        key={sticker.id}
                        onClick={() => {
                            props.setSelectedSticker(sticker)
                            props.setPanel('none')
                        }}
                    >
                        <img
                            src={storageUrl(sticker.image_path)!}
                            className="h-20 w-20 object-contain"
                        />
                    </button>
                ))}
            </div>
        )
    }
    if (props.panel === 'attach') {
        return (
            <div className="absolute bottom-5 left-24 z-10 max-h-96 w-96 overflow-auto rounded-lg border bg-popover p-4 shadow-xl">
                <p className="mb-3 text-sm text-muted-foreground">
                    Attach up to 3 series, novels, or art posts.
                </p>
                {props.attachments.map((item: AttachOption) => (
                    <button
                        key={`${item.type}-${item.id}`}
                        className="flex w-full items-center gap-3 rounded p-2 text-left hover:bg-muted disabled:opacity-50"
                        disabled={
                            props.selectedAttachments.some((selected: AttachOption) => selected.type === item.type && selected.id === item.id) ||
                            props.selectedAttachments.length >= 3
                        }
                        onClick={() => {
                            props.setSelectedAttachments((current: AttachOption[]) => [...current, item].slice(0, 3))
                            props.setPanel('none')
                        }}
                    >
                        <div className="h-14 w-14 overflow-hidden rounded bg-muted">
                            {item.image_path && (
                                <img
                                    src={storageUrl(item.image_path)!}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>
                        <span>
                            <b>{item.title}</b>
                            <br />
                            <small className="text-muted-foreground">{item.subtitle}</small>
                        </span>
                    </button>
                ))}
            </div>
        )
    }
    return null
}

function ImageViewer({ image, onClose }: { image: string | null; onClose: () => void }) {
    if (!image) return null

    return (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4" onClick={onClose}>
            <Button type="button" variant="secondary" size="icon" className="absolute right-4 top-4" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
            <img src={image} alt="" className="max-h-full max-w-full object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
    )
}

function formatFeedDate(value: string | Date) {
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

