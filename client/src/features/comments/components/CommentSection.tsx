import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    BadgeCheck,
    Bold,
    EyeOff,
    Film,
    Gift,
    Glasses,
    Heart,
    Image as ImageIcon,
    ImageOff,
    Italic,
    Loader2,
    MessageCircle,
    Pin,
    Reply,
    Rocket,
    Send,
    ShieldCheck,
    Smile,
    Star,
    Sticker,
    Trash2,
    X,
} from 'lucide-react'
import { commentsApi } from '@/api/comments'
import type { ArtistSticker } from '@/types/artistProfile'
import type { CommentSort, CommentTargetType, PublicComment } from '@/types/comment'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import SuperLikeButton from './SuperLikeButton'

const REACTION_EMOJIS = ['😀', '😂', '😭', '🔥', '❤️']
const COMMENT_SORTS: Array<{ value: CommentSort; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'latest', label: 'Latest' },
    { value: 'popular', label: 'Popular' },
]

interface CommentSectionProps {
    targetType: CommentTargetType
    targetId: string
    artistUsername?: string | null
    title?: string
    compact?: boolean
}

export default function CommentSection({
    targetType,
    targetId,
    artistUsername,
    title = 'Comments',
    compact = false,
}: CommentSectionProps) {
    const [sort, setSort] = useState<CommentSort>('all')
    const [body, setBody] = useState('')
    const [reactionEmoji, setReactionEmoji] = useState<string | null>(null)
    const [gifUrl, setGifUrl] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [emojiOpen, setEmojiOpen] = useState(false)
    const [mediaOpen, setMediaOpen] = useState(false)
    const [stickerOpen, setStickerOpen] = useState(false)
    const [selectedSticker, setSelectedSticker] = useState<ArtistSticker | null>(null)
    const [replyingTo, setReplyingTo] = useState<PublicComment | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const imageInputRef = useRef<HTMLInputElement | null>(null)
    const { token, user } = useAuthStore()
    const { openLogin } = useModalStore()
    const queryClient = useQueryClient()

    const commentsKey = ['comments', targetType, targetId, sort]

    const { data, isLoading } = useQuery({
        queryKey: commentsKey,
        queryFn: () => commentsApi.index(targetType, targetId, sort).then((res) => res.data),
    })

    useEffect(() => {
        if (!imageFile) {
            setImagePreview(null)
            return
        }

        const nextPreview = URL.createObjectURL(imageFile)
        setImagePreview(nextPreview)

        return () => URL.revokeObjectURL(nextPreview)
    }, [imageFile])

    const createMutation = useMutation({
        mutationFn: () => {
            const payload = new FormData()
            if (body.trim()) payload.append('body', body.trim())
            if (selectedSticker?.id) payload.append('artist_sticker_id', selectedSticker.id)
            if (replyingTo?.id) payload.append('parent_id', replyingTo.id)
            if (reactionEmoji) payload.append('reaction_emoji', reactionEmoji)
            if (gifUrl.trim()) payload.append('gif_url', gifUrl.trim())
            if (imageUrl.trim()) payload.append('image_url', imageUrl.trim())
            if (imageFile) payload.append('image', imageFile)

            return commentsApi.create(targetType, targetId, payload).then((res) => res.data)
        },
        onSuccess: () => {
            setBody('')
            setReactionEmoji(null)
            setGifUrl('')
            setImageUrl('')
            setSelectedSticker(null)
            setReplyingTo(null)
            setImageFile(null)
            if (imageInputRef.current) imageInputRef.current.value = ''
            queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not post comment.')
        },
    })

    const pinMutation = useMutation({
        mutationFn: ({ commentId, isPinned }: { commentId: string; isPinned: boolean }) =>
            commentsApi.pin(commentId, isPinned).then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'You cannot pin this comment.')
        },
    })

    const likeMutation = useMutation({
        mutationFn: (commentId: string) => commentsApi.like(commentId).then((res) => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] }),
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not like this comment.')
        },
    })

    const removeMutation = useMutation({
        mutationFn: (commentId: string) => commentsApi.remove(commentId).then((res) => res.data),
        onSuccess: () => {
            toast.success('Comment removed.')
            queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not remove this comment.')
        },
    })

    const comments = data?.data ?? []
    const hasDraft =
        Boolean(body.trim()) ||
        Boolean(selectedSticker) ||
        Boolean(reactionEmoji) ||
        Boolean(gifUrl.trim()) ||
        Boolean(imageUrl.trim()) ||
        Boolean(imageFile)

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!token) {
            openLogin()
            return
        }

        if (!hasDraft) {
            toast.error('Write a comment, choose a sticker, upload an image, or add a reaction.')
            return
        }

        createMutation.mutate()
    }

    const wrapSelectedText = (prefix: string, suffix = prefix) => {
        const textarea = textareaRef.current
        const start = textarea?.selectionStart ?? body.length
        const end = textarea?.selectionEnd ?? body.length
        const selectedText = body.slice(start, end)
        const nextBody = `${body.slice(0, start)}${prefix}${selectedText}${suffix}${body.slice(end)}`
        const nextSelectionStart = start + prefix.length
        const nextSelectionEnd = nextSelectionStart + selectedText.length

        setBody(nextBody)
        requestAnimationFrame(() => {
            textarea?.focus()
            textarea?.setSelectionRange(nextSelectionStart, nextSelectionEnd)
        })
    }

    return (
        <section className={compact ? 'space-y-4' : 'rounded-xl bg-background p-4 shadow-sm'}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <h2 className="text-base font-semibold">{title}</h2>
                    <span className="text-xs text-muted-foreground">({data?.total ?? 0})</span>
                </div>

                <div className="flex flex-wrap gap-1">
                    {COMMENT_SORTS.map((nextSort) => (
                        <Button
                            key={nextSort.value}
                            type="button"
                            size="sm"
                            variant={sort === nextSort.value ? 'default' : 'ghost'}
                            onClick={() => setSort(nextSort.value)}
                            className="h-8 rounded-full px-3"
                        >
                            {nextSort.label}
                        </Button>
                    ))}
                </div>
            </div>

            <form onSubmit={submit} className="mb-5 flex gap-3 border-b pb-4">
                <CommentAvatar
                    name={user?.name ?? 'Guest'}
                    avatar={user?.avatar ?? null}
                    role={user?.role}
                />
                <div className="min-w-0 flex-1">
                    {replyingTo && (
                        <div className="mb-2 flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                            <span className="min-w-0 truncate">
                                Replying to @{replyingTo.user?.username ?? 'unknown'}
                            </span>
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                onClick={() => setReplyingTo(null)}
                                title="Cancel reply"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    <Textarea
                        ref={textareaRef}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder="Add a comment. Markdown, @mentions, and ||spoilers|| are supported."
                        className="min-h-20 resize-none rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => wrapSelectedText('**')}
                            title="Bold selected text"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => wrapSelectedText('*')}
                            title="Italic selected text"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full px-2 text-xs"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => wrapSelectedText('||')}
                            title="Spoiler selected text"
                        >
                            <EyeOff className="h-4 w-4" />
                            Spoiler
                        </Button>
                    </div>

                    {reactionEmoji && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                            <span className="text-lg">{reactionEmoji}</span>
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                className="h-5 w-5 rounded-full"
                                onClick={() => setReactionEmoji(null)}
                                title="Remove reaction"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}

                    {selectedSticker && (
                        <div className="relative mt-3 inline-flex h-[150px] w-[150px] items-center justify-center bg-transparent p-1">
                            <img
                                src={storageUrl(selectedSticker.image_path)!}
                                alt={selectedSticker.name}
                                draggable={false}
                                onContextMenu={(event) => event.preventDefault()}
                                className="h-full w-full select-none object-contain"
                            />
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="secondary"
                                className="absolute -right-2 -top-2 rounded-full shadow-sm"
                                onClick={() => setSelectedSticker(null)}
                                title="Remove sticker"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}

                    {emojiOpen && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {REACTION_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setReactionEmoji((current) => (current === emoji ? null : emoji))}
                                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xl transition hover:bg-muted ${
                                        reactionEmoji === emoji ? 'bg-muted ring-2 ring-foreground/40' : ''
                                    }`}
                                    aria-label={`React with ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {mediaOpen && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <label className="grid gap-1 text-xs text-muted-foreground">
                                GIF URL
                                <Input
                                    value={gifUrl}
                                    onChange={(event) => setGifUrl(event.target.value)}
                                    placeholder="https://..."
                                />
                            </label>
                            <label className="grid gap-1 text-xs text-muted-foreground">
                                Image URL
                                <Input
                                    value={imageUrl}
                                    onChange={(event) => setImageUrl(event.target.value)}
                                    placeholder="https://..."
                                />
                            </label>
                        </div>
                    )}

                    {imagePreview && (
                        <div className="relative mt-3 inline-block overflow-hidden rounded-lg bg-muted">
                            <img
                                src={imagePreview}
                                alt="Comment upload preview"
                                className="max-h-48 max-w-[280px] object-contain"
                            />
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="secondary"
                                className="absolute right-2 top-2 rounded-full shadow-sm"
                                onClick={() => {
                                    setImageFile(null)
                                    if (imageInputRef.current) imageInputRef.current.value = ''
                                }}
                                title="Remove uploaded image"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-1">
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setEmojiOpen((open) => !open)}
                                title="Reaction emoji"
                            >
                                <Smile className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => {
                                    if (!token) openLogin()
                                    else setStickerOpen(true)
                                }}
                                title="Stickers"
                            >
                                <Sticker className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setMediaOpen((open) => !open)}
                                title="GIF or image"
                            >
                                <Film className="h-4 w-4" />
                            </Button>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                            />
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => imageInputRef.current?.click()}
                                title="Upload image"
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button type="submit" disabled={createMutation.isPending} className="self-end rounded-full">
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Send
                        </Button>
                    </div>
                </div>
            </form>

            {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading comments...</div>
            ) : comments.length === 0 ? (
                <div className="py-8 text-center">
                    <MessageCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                </div>
            ) : (
                <div className="divide-y">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            canPin={Boolean(token)}
                            pinning={pinMutation.isPending}
                            onPin={(commentId, isPinned) => pinMutation.mutate({ commentId, isPinned })}
                            onReply={(nextComment) => {
                                if (!token) {
                                    openLogin()
                                    return
                                }
                                setReplyingTo(nextComment)
                                requestAnimationFrame(() => textareaRef.current?.focus())
                            }}
                            onLike={(commentId) => {
                                if (!token) {
                                    openLogin()
                                    return
                                }
                                likeMutation.mutate(commentId)
                            }}
                            onRemove={(commentId) => {
                                if (!token) {
                                    openLogin()
                                    return
                                }
                                removeMutation.mutate(commentId)
                            }}
                            likingCommentId={likeMutation.isPending ? likeMutation.variables ?? null : null}
                            removingCommentId={removeMutation.isPending ? removeMutation.variables ?? null : null}
                            currentUserId={user?.id ?? null}
                            currentRole={user?.role}
                        />
                    ))}
                </div>
            )}

            <StickerPickerDialog
                open={stickerOpen}
                onOpenChange={setStickerOpen}
                artistUsername={artistUsername}
                onSelect={(sticker) => {
                    setSelectedSticker(sticker)
                    setStickerOpen(false)
                }}
            />
        </section>
    )
}

function CommentItem({
    comment,
    canPin,
    pinning,
    onPin,
    onReply,
    onLike,
    onRemove,
    likingCommentId,
    removingCommentId,
    currentUserId,
    currentRole,
    depth = 0,
}: {
    comment: PublicComment
    canPin: boolean
    pinning: boolean
    onPin: (commentId: string, isPinned: boolean) => void
    onReply: (comment: PublicComment) => void
    onLike: (commentId: string) => void
    onRemove: (commentId: string) => void
    likingCommentId: string | null
    removingCommentId: string | null
    currentUserId: string | null
    currentRole?: string
    depth?: number
}) {
    const role = comment.user?.role
    const verified = Boolean(comment.user?.artist_verified) || role === 'super_admin'
    const moderator = role === 'super_admin'
    const replies = comment.replies ?? []
    const canRemove = currentRole === 'super_admin' || currentUserId === comment.user?.id

    return (
        <article
            id={`comment-${comment.id}`}
            className={`flex gap-3 py-4 ${depth > 0 ? 'ml-8 border-l pl-4' : ''} ${
                comment.is_pinned ? 'bg-muted/25 px-2' : ''
            }`}
        >
            <CommentAvatar
                name={comment.user?.name ?? 'Unknown'}
                avatar={comment.user?.avatar ?? null}
                role={role}
            />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="max-w-[180px] truncate text-sm font-semibold">
                        {comment.user?.name ?? 'Unknown'}
                    </span>
                    {verified && (
                        <BadgeCheck
                            className="h-3.5 w-3.5 text-sky-500"
                            aria-label="Verified creator"
                        />
                    )}
                    {moderator && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                            <ShieldCheck className="h-3 w-3" />
                            Moderator
                        </span>
                    )}
                    {comment.is_pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <Pin className="h-3 w-3" />
                            Pinned
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                </div>

                {comment.parent && (
                    <button
                        type="button"
                        className="mt-2 rounded-md bg-muted px-2 py-1 text-left text-xs text-muted-foreground hover:text-foreground"
                        onClick={() =>
                            document
                                .getElementById(`comment-${comment.parent?.id}`)
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                    >
                        Replying to @{comment.parent.user?.username ?? 'unknown'}: {comment.parent.body ?? 'comment'}
                    </button>
                )}

                {comment.body && <MarkdownText text={comment.body} spoiler={comment.is_spoiler} />}

                <CommentMedia comment={comment} />

                {comment.awards && comment.awards.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {comment.awards.map((award) => {
                            const Icon = iconForAward(award.icon)
                            return (
                                <span
                                    key={award.id ?? award.icon}
                                    className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-300"
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {award.name} x{award.count ?? 0}
                                </span>
                            )
                        })}
                    </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {comment.reaction_emoji && (
                        <span className="inline-flex h-8 items-center justify-center rounded-full bg-muted px-3 text-lg">
                            {comment.reaction_emoji}
                        </span>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant={comment.liked_by_me ? 'secondary' : 'ghost'}
                        disabled={likingCommentId === comment.id}
                        className="h-8 rounded-full px-2 text-xs"
                        onClick={() => onLike(comment.id)}
                    >
                        <Heart
                            className={`h-3.5 w-3.5 ${comment.liked_by_me ? 'fill-current text-red-500' : ''}`}
                        />
                        {comment.likes_count ?? 0}
                    </Button>
                    <SuperLikeButton
                        targetType="comment"
                        targetId={comment.id}
                        initialCount={comment.super_likes_count}
                        label=""
                        ownerUserId={comment.user?.id}
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full px-2 text-xs"
                        onClick={() => onReply(comment)}
                    >
                        <Reply className="h-3.5 w-3.5" />
                        Reply
                    </Button>
                    {canPin && (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={pinning}
                            className="h-8 rounded-full px-2 text-xs"
                            onClick={() => onPin(comment.id, !comment.is_pinned)}
                        >
                            <Pin className="h-3.5 w-3.5" />
                            {comment.is_pinned ? 'Unpin' : 'Pin'}
                        </Button>
                    )}
                    {canRemove && (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={removingCommentId === comment.id}
                            className="h-8 rounded-full px-2 text-xs text-red-500 hover:text-red-500"
                            onClick={() => onRemove(comment.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                        </Button>
                    )}
                </div>

                {replies.length > 0 && (
                    <div className="mt-3 divide-y">
                        {replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                canPin={canPin}
                                pinning={pinning}
                                onPin={onPin}
                                onReply={onReply}
                                onLike={onLike}
                                onRemove={onRemove}
                                likingCommentId={likingCommentId}
                                removingCommentId={removingCommentId}
                                currentUserId={currentUserId}
                                currentRole={currentRole}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </article>
    )
}

function CommentMedia({ comment }: { comment: PublicComment }) {
    return (
        <div className="mt-3 flex flex-wrap gap-3">
            {comment.sticker && (
                <div className="h-[150px] w-[150px] bg-transparent p-1">
                    <img
                        src={storageUrl(comment.sticker.image_path)!}
                        alt={comment.sticker.name}
                        draggable={false}
                        onContextMenu={(event) => event.preventDefault()}
                        className="h-full w-full select-none object-contain"
                    />
                </div>
            )}
            {comment.gif_url && (
                <a
                    href={comment.gif_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block max-w-[320px] overflow-hidden rounded-lg bg-muted"
                >
                    <img
                        src={comment.gif_url}
                        alt="Comment GIF"
                        draggable={false}
                        onContextMenu={(event) => event.preventDefault()}
                        className="max-h-56 w-full select-none object-contain"
                    />
                </a>
            )}
            {comment.image_url && (
                <a
                    href={comment.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block max-w-[320px] overflow-hidden rounded-lg bg-muted"
                >
                    <img
                        src={comment.image_url}
                        alt="Comment attachment"
                        draggable={false}
                        onContextMenu={(event) => event.preventDefault()}
                        className="max-h-56 w-full select-none object-contain"
                    />
                </a>
            )}
            {comment.image_path && (
                <div className="block max-w-[320px] overflow-hidden rounded-lg bg-muted">
                    <img
                        src={storageUrl(comment.image_path)!}
                        alt="Comment upload"
                        draggable={false}
                        onContextMenu={(event) => event.preventDefault()}
                        className="max-h-56 w-full select-none object-contain"
                    />
                </div>
            )}
        </div>
    )
}

function iconForAward(icon: string) {
    if (icon === 'rocket') return Rocket
    if (icon === 'glasses') return Glasses
    if (icon === 'star') return Star

    return Gift
}

function CommentAvatar({
    name,
    avatar,
    role,
}: {
    name: string
    avatar: string | null
    role?: 'super_admin' | 'storyteller' | 'wanderer'
}) {
    const initial = name[0]?.toUpperCase() ?? 'U'
    const avatarUrl = avatar ? storageUrl(avatar) : null

    return (
        <Avatar className="mt-0.5 h-9 w-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{initial}</AvatarFallback>
            {role === 'super_admin' && (
                <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-rose-600 p-0.5 text-white ring-2 ring-background">
                    <ShieldCheck className="h-2.5 w-2.5" />
                </span>
            )}
        </Avatar>
    )
}

function MarkdownText({ text, spoiler }: { text: string; spoiler: boolean }) {
    const [revealed, setRevealed] = useState(!spoiler)

    if (spoiler && !revealed) {
        return (
            <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                onClick={() => setRevealed(true)}
            >
                <EyeOff className="h-4 w-4" />
                Spoiler comment. Click to reveal.
            </button>
        )
    }

    return (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
            {text.split('\n').map((line, index) => (
                <Fragment key={`line-${index}`}>
                    {index > 0 ? '\n' : null}
                    {renderInlineMarkdown(line, `line-${index}`)}
                </Fragment>
            ))}
        </p>
    )
}

const INLINE_MARKDOWN_PATTERN =
    /(\|\|[^|]+\|\||\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|@[A-Za-z0-9_]+)/g

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
    const nodes: ReactNode[] = []
    let lastIndex = 0

    for (const match of text.matchAll(INLINE_MARKDOWN_PATTERN)) {
        const token = match[0]
        const index = match.index ?? 0
        if (index > lastIndex) nodes.push(text.slice(lastIndex, index))
        nodes.push(renderMarkdownToken(token, `${keyPrefix}-${index}`))
        lastIndex = index + token.length
    }

    if (lastIndex < text.length) nodes.push(text.slice(lastIndex))

    return nodes
}

function renderMarkdownToken(token: string, key: string): ReactNode {
    if (token.startsWith('||') && token.endsWith('||')) {
        return <InlineSpoiler key={key} text={token.slice(2, -2)} />
    }

    if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={key}>{token.slice(2, -2)}</strong>
    }

    if (token.startsWith('*') && token.endsWith('*')) {
        return <em key={key}>{token.slice(1, -1)}</em>
    }

    if (token.startsWith('`') && token.endsWith('`')) {
        return (
            <code key={key} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
                {token.slice(1, -1)}
            </code>
        )
    }

    if (token.startsWith('@')) {
        return (
            <span key={key} className="font-medium text-sky-600 dark:text-sky-400">
                {token}
            </span>
        )
    }

    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (link) {
        return (
            <a
                key={key}
                href={link[2]}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
            >
                {link[1]}
            </a>
        )
    }

    return token
}

function InlineSpoiler({ text }: { text: string }) {
    const [revealed, setRevealed] = useState(false)

    return (
        <button
            type="button"
            className="mx-0.5 rounded bg-foreground px-1.5 py-0.5 text-background"
            onClick={() => setRevealed(true)}
        >
            {revealed ? text : 'Spoiler'}
        </button>
    )
}

function StickerPickerDialog({
    open,
    onOpenChange,
    artistUsername,
    onSelect,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    artistUsername?: string | null
    onSelect: (sticker: ArtistSticker) => void
}) {
    const queryClient = useQueryClient()
    const { data: library, isLoading: libraryLoading } = useQuery({
        queryKey: ['comment-sticker-library'],
        queryFn: () => commentsApi.stickerLibrary().then((res) => res.data.data),
        enabled: open,
    })
    const { data: store, isLoading: storeLoading } = useQuery({
        queryKey: ['artist-sticker-store', artistUsername],
        queryFn: () => commentsApi.artistStickers(artistUsername!).then((res) => res.data.data),
        enabled: open && Boolean(artistUsername),
    })

    const purchaseMutation = useMutation({
        mutationFn: (stickerId: string) => commentsApi.purchaseSticker(stickerId).then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comment-sticker-library'] })
            queryClient.invalidateQueries({ queryKey: ['artist-sticker-store', artistUsername] })
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            toast.success('Sticker bought.')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not buy sticker.')
        },
    })

    const subscribeMutation = useMutation({
        mutationFn: (stickerId: string) => commentsApi.subscribeSticker(stickerId).then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comment-sticker-library'] })
            queryClient.invalidateQueries({ queryKey: ['artist-sticker-store', artistUsername] })
            toast.success('Sticker subscribed.')
        },
        onError: () => toast.error('Could not subscribe to sticker.'),
    })

    const myStickers = useMemo(() => library ?? [], [library])
    const artistStickers = useMemo(() => store ?? [], [store])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[min(96vw,920px)] max-w-none">
                <DialogHeader>
                    <DialogTitle>Stickers</DialogTitle>
                    <DialogDescription>
                        Pick from your library or load the artist sticker shelf.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="library">
                    <TabsList>
                        <TabsTrigger value="library">My Library</TabsTrigger>
                        <TabsTrigger value="artist" disabled={!artistUsername}>
                            Artist Stickers
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="library">
                        <StickerGrid
                            stickers={myStickers}
                            loading={libraryLoading}
                            empty="No stickers in your library yet"
                            onSelect={onSelect}
                        />
                    </TabsContent>

                    <TabsContent value="artist">
                        <StickerGrid
                            stickers={artistStickers}
                            loading={storeLoading}
                            empty="No artist stickers yet"
                            onSelect={onSelect}
                            onBuy={(sticker) => purchaseMutation.mutate(sticker.id)}
                            onSubscribe={(sticker) => subscribeMutation.mutate(sticker.id)}
                            busy={purchaseMutation.isPending || subscribeMutation.isPending}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

function StickerGrid({
    stickers,
    loading,
    empty,
    onSelect,
    onBuy,
    onSubscribe,
    busy = false,
}: {
    stickers: ArtistSticker[]
    loading: boolean
    empty: string
    onSelect: (sticker: ArtistSticker) => void
    onBuy?: (sticker: ArtistSticker) => void
    onSubscribe?: (sticker: ArtistSticker) => void
    busy?: boolean
}) {
    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (stickers.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center">
                <ImageOff className="mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{empty}</p>
            </div>
        )
    }

    return (
        <div className="grid max-h-[620px] auto-rows-[190px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {stickers.map((sticker) => {
                const canUse = sticker.can_use ?? sticker.library_status !== undefined

                return (
                    <div key={sticker.id} className="flex h-full flex-col p-2">
                        <button
                            type="button"
                            disabled={!canUse}
                            onClick={() => onSelect(sticker)}
                            className="h-[150px] bg-transparent p-1 transition hover:bg-muted/30 disabled:opacity-60"
                            title={sticker.name}
                        >
                            <img
                                src={storageUrl(sticker.image_path)!}
                                alt={sticker.name}
                                draggable={false}
                                onContextMenu={(event) => event.preventDefault()}
                                className="h-full w-full select-none object-contain"
                            />
                        </button>
                        {canUse ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="mt-1 h-7 w-full"
                                onClick={() => onSelect(sticker)}
                            >
                                Use
                            </Button>
                        ) : (
                            <div className="mt-1 grid grid-cols-2 gap-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => onSubscribe?.(sticker)}
                                >
                                    <Gift className="h-3 w-3" />
                                    Sub
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => onBuy?.(sticker)}
                                >
                                    1cr
                                </Button>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function formatDate(value: string) {
    if (!value) return ''
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}
