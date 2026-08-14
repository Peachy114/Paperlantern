import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    BadgeCheck,
    Bold,
    EyeOff,
    Flag,
    Gift,
    Glasses,
    Heart,
    Image as ImageIcon,
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ViewProfileLink from '@/components/profile/ViewProfileLink'
import SuperLikeButton from './SuperLikeButton'
import { CommentMarkdown } from './CommentMarkdown'
import { CommentStickerPickerDialog } from './CommentStickerPickerDialog'
import {
    COMMENT_REACTION_EMOJIS,
    COMMENT_SORTS,
    INITIAL_VISIBLE_REPLIES,
    compareRepliesOldestFirst,
    normalizeUsername,
} from '@/features/comments/lib/commentThread'

interface CommentSectionProps {
    targetType: CommentTargetType
    targetId: string
    artistUsername?: string | null
    title?: string
    compact?: boolean
    initialVisibleCount?: number
}

export default function CommentSection2({
    targetType,
    targetId,
    artistUsername,
    title = 'Comments',
    compact = false,
    initialVisibleCount,
}: CommentSectionProps) {
    const [sort, setSort] = useState<CommentSort>('all')
    const [body, setBody] = useState('')
    const [reactionEmoji, setReactionEmoji] = useState<string | null>(null)
    const [emojiOpen, setEmojiOpen] = useState(false)
    const [stickerOpen, setStickerOpen] = useState(false)
    const [selectedSticker, setSelectedSticker] = useState<ArtistSticker | null>(null)
    const [replyingTo, setReplyingTo] = useState<PublicComment | null>(null)
    const [reportTarget, setReportTarget] = useState<PublicComment | null>(null)
    const [reportReason, setReportReason] = useState('')
    const [reportDetails, setReportDetails] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [replyPortalTarget, setReplyPortalTarget] = useState<HTMLElement | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const imageInputRef = useRef<HTMLInputElement | null>(null)
    const { token, user } = useAuthStore()
    const { openLogin } = useModalStore()
    const queryClient = useQueryClient()

    const postArtistUsername = normalizeUsername(artistUsername)
    const currentUsername = normalizeUsername(user?.username)
    const isArtistOwnedPost = postArtistUsername.length > 0
    const canPinComments =
        Boolean(token) && isArtistOwnedPost && currentUsername === postArtistUsername

    const commentsKey = ['comments', targetType, targetId, sort]
    const replyingToId = replyingTo?.id ?? null

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

    useEffect(() => {
        if (!replyingToId) {
            setReplyPortalTarget(null)
            return
        }

        let focusFrame: number | null = null
        const mountFrame = window.requestAnimationFrame(() => {
            const target = document.getElementById(`reply-composer-slot-${replyingToId}`)
            setReplyPortalTarget(target)

            focusFrame = window.requestAnimationFrame(() => {
                target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                textareaRef.current?.focus()
            })
        })

        return () => {
            window.cancelAnimationFrame(mountFrame)
            if (focusFrame !== null) window.cancelAnimationFrame(focusFrame)
        }
    }, [replyingToId])

    const createMutation = useMutation({
        mutationFn: () => {
            const payload = new FormData()
            if (body.trim()) payload.append('body', body.trim())
            if (selectedSticker?.id) payload.append('artist_sticker_id', selectedSticker.id)
            if (replyingTo?.id) {
                payload.append('parent_id', replyingTo.parent_id ?? replyingTo.id)
                payload.append('reply_to_id', replyingTo.id)
            }
            if (reactionEmoji) payload.append('reaction_emoji', reactionEmoji)
            if (imageFile) payload.append('image', imageFile)

            return commentsApi.create(targetType, targetId, payload).then((res) => res.data)
        },
        onSuccess: () => {
            setBody('')
            setReactionEmoji(null)
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
        mutationFn: ({ commentId, isPinned }: { commentId: string; isPinned: boolean }) => {
            if (!canPinComments) {
                throw new Error('Only the artist who owns this post can pin comments.')
            }

            return commentsApi.pin(commentId, isPinned).then((res) => res.data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] })
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message ?? error.message ?? 'You cannot pin this comment.'
            )
        },
    })

    const likeMutation = useMutation({
        mutationFn: (commentId: string) => commentsApi.like(commentId).then((res) => res.data),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] }),
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

    const reportMutation = useMutation({
        mutationFn: () =>
            commentsApi
                .report(reportTarget!.id, {
                    reason: reportReason.trim(),
                    details: reportDetails.trim() || undefined,
                })
                .then((res) => res.data),
        onSuccess: (result) => {
            toast.success(`Report sent. Support #${result.support_number}`)
            setReportTarget(null)
            setReportReason('')
            setReportDetails('')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not send report.')
        },
    })

    const comments = useMemo(() => {
        const items = [...(data?.data ?? [])]

        return items.sort((a, b) => {
            const aPinned = Boolean(a.is_pinned)
            const bPinned = Boolean(b.is_pinned)

            if (aPinned === bPinned) {
                return 0
            }

            return aPinned ? -1 : 1
        })
    }, [data?.data])

    const [expandedComments, setExpandedComments] = useState(false)
    const visibleComments =
        initialVisibleCount && !expandedComments ? comments.slice(0, initialVisibleCount) : comments
    const hiddenCommentCount =
        initialVisibleCount && comments.length > initialVisibleCount
            ? comments.length - initialVisibleCount
            : 0
    const displayTitle = title.trim().toLowerCase().endsWith(' comments') ? 'Comments' : title
    const hasDraft =
        Boolean(body.trim()) ||
        Boolean(selectedSticker) ||
        Boolean(reactionEmoji) ||
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

    const commentComposer = (
        <form onSubmit={submit} className="mb-5">
            {replyingTo && (
                <div
                    className="
                            mb-2
                            flex
                            items-center
                            justify-between
                            gap-3
                            rounded-[8px]
                            border
                            border-orange-300
                            bg-orange-50
                            px-3
                            py-2
                            text-[11px]
                            text-orange-700
                            dark:border-orange-800
                            dark:bg-orange-950/20
                            dark:text-orange-300
                        "
                >
                    <span className="min-w-0 truncate">
                        Replying to @
                        {replyingTo.user?.username ?? replyingTo.user?.name ?? 'unknown'}
                    </span>

                    <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setReplyingTo(null)}
                        title="Cancel reply"
                        className="h-6 w-6 rounded-full"
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}

            <div
                className="
                        mb-2
                        flex
                        flex-wrap
                        items-center
                        gap-1
                        rounded-[10px]
                        border
                        border-border
                        bg-muted/20
                        p-2
                    "
            >
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-[6px] px-2 text-[10px]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => wrapSelectedText('## ', '')}
                    title="Heading"
                >
                    H
                </Button>

                <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="h-7 w-7 rounded-[6px]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => wrapSelectedText('**')}
                    title="Bold"
                >
                    <Bold className="h-3.5 w-3.5" />
                </Button>

                <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="h-7 w-7 rounded-[6px]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => wrapSelectedText('*')}
                    title="Italic"
                >
                    <Italic className="h-3.5 w-3.5" />
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-[6px] px-2 text-[10px]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => wrapSelectedText('- ', '')}
                    title="Bullet"
                >
                    Bullet
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-[6px] px-2 text-[10px]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => wrapSelectedText('||')}
                    title="Spoiler"
                >
                    <EyeOff className="h-3.5 w-3.5" />
                    Spoiler
                </Button>
            </div>

            <div
                className="
                        overflow-hidden
                        rounded-[14px]
                        border
                        border-border
                        bg-background
                        transition
                        focus-within:border-foreground/30
                        focus-within:ring-2
                        focus-within:ring-sky-200/50
                    "
            >
                <Textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Add comment ..."
                    className="
                            min-h-[108px]
                            resize-none
                            rounded-none
                            border-0
                            bg-transparent
                            px-4
                            py-3
                            text-[11px]
                            shadow-none
                            placeholder:text-muted-foreground
                            focus-visible:ring-0
                        "
                />

                {imagePreview && (
                    <div className="px-4 pb-3">
                        <div className="relative inline-block overflow-hidden rounded-[10px] border bg-muted">
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

                                    if (imageInputRef.current) {
                                        imageInputRef.current.value = ''
                                    }
                                }}
                                title="Remove uploaded image"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}

                {selectedSticker && (
                    <div className="px-4 pb-3">
                        <div className="relative inline-flex h-[150px] w-[150px] items-center justify-center bg-transparent p-1">
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
                    </div>
                )}

                {reactionEmoji && (
                    <div className="px-4 pb-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
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
                    </div>
                )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1">
                    <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className={`
                                h-7
                                w-7
                                rounded-[6px]
                                ${emojiOpen ? 'bg-muted text-orange-500' : ''}
                            `}
                        onClick={() => setEmojiOpen((open) => !open)}
                        title="Reaction emoji"
                    >
                        <Smile className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="h-7 w-7 rounded-[6px]"
                        onClick={() => {
                            if (!token) {
                                openLogin()
                            } else {
                                setStickerOpen(true)
                            }
                        }}
                        title="Stickers"
                    >
                        <Sticker className="h-3.5 w-3.5" />
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
                        className="h-7 w-7 rounded-[6px]"
                        onClick={() => imageInputRef.current?.click()}
                        title="Upload image"
                    >
                        <ImageIcon className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="
                            h-7
                            rounded-[7px]
                            bg-orange-400
                            px-5
                            text-[11px]
                            font-semibold
                            text-white
                            shadow-none
                            hover:bg-orange-500
                        "
                >
                    {createMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Send className="h-3.5 w-3.5" />
                    )}
                    Send
                </Button>
            </div>

            {emojiOpen && (
                <div
                    className="
                            mt-2
                            flex
                            flex-wrap
                            gap-1
                            rounded-[10px]
                            border
                            border-border
                            bg-muted/20
                            p-2
                        "
                >
                    {COMMENT_REACTION_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() =>
                                setReactionEmoji((current) => (current === emoji ? null : emoji))
                            }
                            className={`
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-full
                                    text-lg
                                    transition
                                    hover:bg-muted
                                    ${
                                        reactionEmoji === emoji
                                            ? 'bg-muted ring-2 ring-foreground/30'
                                            : ''
                                    }
                                `}
                            aria-label={`React with ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            <div
                className="
                        mt-4
                        h-px
                        w-full
                        bg-gradient-to-r
                        from-orange-400
                        via-yellow-300
                        to-sky-400
                    "
            />
        </form>
    )

    return (
        <section className={compact ? 'w-full space-y-5' : 'w-full bg-background'}>
            <div className="mb-2 flex items-center justify-between gap-4 border-b border-border pb-2">
                <div className="flex min-w-0 items-center gap-2">
                    <MessageCircle className="h-4 w-4 shrink-0" />

                    <h2 className="truncate text-[15px] font-bold tracking-tight">
                        {displayTitle}
                        <span className="ml-1">({data?.total ?? 0})</span>
                    </h2>
                </div>

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        overflow-hidden
                        rounded-[4px]
                    "
                    aria-label="Comment sorting"
                >
                    {COMMENT_SORTS.map((nextSort) => {
                        const active = sort === nextSort.value

                        return (
                            <button
                                key={nextSort.value}
                                type="button"
                                onClick={() => setSort(nextSort.value)}
                                className={`
                                    h-6
                                    min-w-[42px]
                                    border
                                    px-2
                                    text-[10px]
                                    font-medium
                                    leading-none
                                    transition
                                    first:rounded-l-[4px]
                                    last:rounded-r-[4px]
                                    [&:not(:first-child)]:-ml-px
                                    ${
                                        active
                                            ? 'relative z-10 border-(--comix-accent) bg-banner text-white'
                                            : 'border-foreground/20 bg-background text-foreground hover:bg-muted'
                                    }
                                `}
                            >
                                {nextSort.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {replyingToId
                ? replyPortalTarget
                    ? createPortal(commentComposer, replyPortalTarget)
                    : null
                : commentComposer}

            {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                    Loading comments...
                </div>
            ) : comments.length === 0 ? (
                <div className="rounded-[14px] border border-dashed py-10 text-center">
                    <MessageCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {visibleComments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            replyingToId={replyingToId}
                            canPin={canPinComments}
                            pinning={pinMutation.isPending}
                            onPin={(commentId, isPinned) =>
                                pinMutation.mutate({
                                    commentId,
                                    isPinned,
                                })
                            }
                            onReply={(nextComment) => {
                                if (!token) {
                                    openLogin()
                                    return
                                }

                                setReplyPortalTarget(null)
                                setReplyingTo(nextComment)
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
                            onReport={(nextComment) => {
                                if (!token) {
                                    openLogin()
                                    return
                                }

                                setReportTarget(nextComment)
                                setReportReason('')
                                setReportDetails('')
                            }}
                            likingCommentId={
                                likeMutation.isPending ? (likeMutation.variables ?? null) : null
                            }
                            removingCommentId={
                                removeMutation.isPending ? (removeMutation.variables ?? null) : null
                            }
                            currentUserId={user?.id ?? null}
                            currentRole={user?.role}
                        />
                    ))}
                    {hiddenCommentCount > 0 && !expandedComments && (
                        <div className="pt-1 text-center">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setExpandedComments(true)}
                            >
                                More + {hiddenCommentCount}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <CommentStickerPickerDialog
                open={stickerOpen}
                onOpenChange={setStickerOpen}
                artistUsername={artistUsername}
                onSelect={(sticker) => {
                    setSelectedSticker(sticker)
                    setStickerOpen(false)
                }}
            />

            <Dialog
                open={Boolean(reportTarget)}
                onOpenChange={(open) => !open && setReportTarget(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Report Comment</DialogTitle>

                        <DialogDescription>
                            This creates a support ticket for admin review.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 py-2">
                        <label className="grid gap-1 text-sm">
                            <span>Reason</span>

                            <Textarea
                                value={reportReason}
                                onChange={(event) => setReportReason(event.target.value)}
                                rows={2}
                                placeholder="Spam, harassment, spoiler, unsafe content..."
                            />
                        </label>

                        <label className="grid gap-1 text-sm">
                            <span>Details</span>

                            <Textarea
                                value={reportDetails}
                                onChange={(event) => setReportDetails(event.target.value)}
                                rows={3}
                                placeholder="Optional extra details for support"
                            />
                        </label>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReportTarget(null)}
                            disabled={reportMutation.isPending}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            disabled={!reportReason.trim() || reportMutation.isPending}
                            onClick={() => reportMutation.mutate()}
                        >
                            {reportMutation.isPending ? 'Sending...' : 'Send Report'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

function CommentItem({
    comment,
    replyingToId,
    canPin,
    pinning,
    onPin,
    onReply,
    onLike,
    onRemove,
    onReport,
    likingCommentId,
    removingCommentId,
    currentUserId,
    currentRole,
    depth = 0,
}: {
    comment: PublicComment
    replyingToId: string | null
    canPin: boolean
    pinning: boolean
    onPin: (commentId: string, isPinned: boolean) => void
    onReply: (comment: PublicComment) => void
    onLike: (commentId: string) => void
    onRemove: (commentId: string) => void
    onReport: (comment: PublicComment) => void
    likingCommentId: string | null
    removingCommentId: string | null
    currentUserId: string | null
    currentRole?: string
    depth?: number
}) {
    const role = comment.user?.role

    const verified = Boolean(comment.user?.artist_verified) || role === 'super_admin'
    const moderator = role === 'super_admin'

    const sortedReplies = useMemo(
        () => [...(comment.replies ?? [])].sort(compareRepliesOldestFirst),
        [comment.replies]
    )
    const [visibleReplyCount, setVisibleReplyCount] = useState(INITIAL_VISIBLE_REPLIES)
    const hiddenReplyCount = Math.max(sortedReplies.length - visibleReplyCount, 0)
    const visibleReplies = sortedReplies.slice(hiddenReplyCount)

    const isOwnComment =
        currentUserId !== null &&
        comment.user?.id !== undefined &&
        String(currentUserId) === String(comment.user.id)

    const canRemove = currentRole === 'super_admin' || isOwnComment
    const awards = comment.awards ?? []
    const boosted =
        !comment.is_pinned && (awards.length > 0 || Number(comment.super_likes_count ?? 0) > 0)
    const authorName = comment.user?.name ?? comment.user?.username ?? 'Unknown'

    useEffect(() => {
        setVisibleReplyCount((current) =>
            Math.min(Math.max(current, INITIAL_VISIBLE_REPLIES), sortedReplies.length)
        )
    }, [sortedReplies.length])

    return (
        <div id={`comment-${comment.id}`} className="relative">
            <CommentFrame
                pinned={Boolean(comment.is_pinned)}
                boosted={boosted}
                isOwnComment={isOwnComment}
            >
                <article
                    className="
                        group
                        relative
                        rounded-[14px]
                        bg-background
                        px-4
                        py-4
                        sm:px-5
                    "
                >
                    {canPin && (
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            disabled={pinning}
                            onClick={() => onPin(comment.id, !comment.is_pinned)}
                            title={comment.is_pinned ? 'Unpin comment' : 'Pin comment'}
                            className={`
                                absolute
                                right-4
                                top-4
                                z-10
                                h-7
                                w-7
                                rounded-[8px]
                                border
                                p-0
                                ${
                                    comment.is_pinned
                                        ? 'border-orange-400 bg-orange-400 text-white hover:bg-orange-500 hover:text-white'
                                        : 'border-orange-300 bg-orange-50 text-orange-500 hover:bg-orange-100 hover:text-orange-600 dark:bg-orange-950/20'
                                }
                            `}
                        >
                            <Pin className="h-3.5 w-3.5" />
                        </Button>
                    )}

                    <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onReply(comment)}
                        title="Reply"
                        className="
                            absolute
                            right-12
                            top-4
                            z-10
                            h-7
                            w-7
                            rounded-[8px]
                            border
                            border-border
                            bg-background
                            p-0
                            text-muted-foreground
                            opacity-0
                            shadow-sm
                            transition
                            hover:text-orange-500
                            focus:opacity-100
                            group-hover:opacity-100
                        "
                    >
                        <Reply className="h-3.5 w-3.5" />
                    </Button>

                    <div className="flex gap-3 pr-16">
                        <CommentAvatar
                            name={authorName}
                            avatar={comment.user?.avatar ?? null}
                            role={role}
                        />

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                <ViewProfileLink
                                    username={comment.user?.username}
                                    role={role}
                                    label={authorName}
                                    className="text-[13px] leading-none"
                                />

                                {moderator && (
                                    <span className="text-[10px] font-semibold text-foreground">
                                        Admin
                                    </span>
                                )}

                                {verified && (
                                    <BadgeCheck
                                        className="h-3.5 w-3.5 fill-sky-500 text-white"
                                        aria-label="Verified creator"
                                    />
                                )}

                                {(comment.reply_to ?? comment.parent) && (
                                    <button
                                        type="button"
                                        className="
                                            min-w-0
                                            truncate
                                            text-[10px]
                                            font-medium
                                            text-orange-500
                                            hover:underline
                                        "
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    `comment-${(comment.reply_to ?? comment.parent)?.id}`
                                                )
                                                ?.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'center',
                                                })
                                        }
                                    >
                                        replied to{' '}
                                        {(comment.reply_to ?? comment.parent)?.user?.name ??
                                            (comment.reply_to ?? comment.parent)?.user?.username ??
                                            'comment'}
                                    </button>
                                )}

                                {awards.slice(0, 3).map((award) => {
                                    const Icon = iconForAward(award.icon)

                                    return (
                                        <span
                                            key={award.id ?? award.icon}
                                            title={`${award.name} x${award.count ?? 0}`}
                                            className="inline-flex items-center text-amber-500"
                                        >
                                            <Icon className="h-3.5 w-3.5 fill-current" />
                                        </span>
                                    )
                                })}
                            </div>

                            <p className="mt-1 text-[10px] leading-none text-muted-foreground">
                                {formatDate(comment.created_at)}
                            </p>
                        </div>
                    </div>

                    {comment.body && (
                        <div className="mt-3 pl-11 pr-1">
                            <CommentMarkdown text={comment.body} spoiler={comment.is_spoiler} />
                        </div>
                    )}

                    <div className="pl-11">
                        <CommentMedia comment={comment} />
                    </div>

                    <div
                        className="
                            mt-3
                            flex
                            flex-wrap
                            items-center
                            gap-1.5
                            pl-11
                        "
                    >
                        {comment.reaction_emoji && (
                            <span
                                className="
                                    inline-flex
                                    h-7
                                    items-center
                                    justify-center
                                    rounded-[7px]
                                    border
                                    border-orange-300
                                    bg-orange-50
                                    px-2
                                    text-sm
                                    dark:bg-orange-950/20
                                "
                            >
                                {comment.reaction_emoji}
                            </span>
                        )}

                        <div
                            className="
                                [&>button]:h-7
                                [&>button]:min-w-0
                                [&>button]:rounded-[7px]
                                [&>button]:border-orange-300
                                [&>button]:bg-orange-50
                                [&>button]:px-2
                                [&>button]:text-[10px]
                                [&>button]:text-orange-500
                                [&>button]:shadow-none
                                dark:[&>button]:bg-orange-950/20
                            "
                        >
                            <SuperLikeButton
                                targetType="comment"
                                targetId={comment.id}
                                initialCount={comment.super_likes_count}
                                label=""
                                ownerUserId={comment.user?.id}
                            />
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={likingCommentId === comment.id}
                            onClick={() => onLike(comment.id)}
                            title="Like"
                            className={`
                                h-7
                                rounded-[7px]
                                px-2
                                text-[10px]
                                ${comment.liked_by_me ? 'text-red-500' : 'text-foreground'}
                            `}
                        >
                            <Heart
                                className={`
                                    h-3.5
                                    w-3.5
                                    ${comment.liked_by_me ? 'fill-current' : ''}
                                `}
                            />

                            {Number(comment.likes_count ?? 0) > 0 && (
                                <span>{formatCompactCount(Number(comment.likes_count ?? 0))}</span>
                            )}
                        </Button>

                        {canRemove ? (
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                disabled={removingCommentId === comment.id}
                                onClick={() => onRemove(comment.id)}
                                title="Remove"
                                className="
                                    h-7
                                    w-7
                                    rounded-[7px]
                                    p-0
                                    text-foreground
                                    hover:text-red-500
                                "
                            >
                                {removingCommentId === comment.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => onReport(comment)}
                                title="Report"
                                className="
                                    h-7
                                    w-7
                                    rounded-[7px]
                                    p-0
                                    text-foreground
                                    hover:text-orange-500
                                "
                            >
                                <Flag className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </article>
            </CommentFrame>

            {replyingToId === comment.id && (
                <div
                    id={`reply-composer-slot-${comment.id}`}
                    className="ml-4 mt-3 border-l-2 border-orange-300 pl-4 dark:border-orange-700"
                />
            )}

            {sortedReplies.length > 0 && (
                <div
                    className="
                        relative
                        ml-4
                        mt-2
                        space-y-4
                        pl-9
                        before:absolute
                        before:bottom-10
                        before:left-3
                        before:top-0
                        before:w-px
                        before:bg-border
                    "
                >
                    {hiddenReplyCount > 0 && (
                        <div className="relative pb-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 rounded-[7px] px-2 text-[10px] text-orange-500"
                                onClick={() =>
                                    setVisibleReplyCount((current) =>
                                        Math.min(
                                            current + INITIAL_VISIBLE_REPLIES,
                                            sortedReplies.length
                                        )
                                    )
                                }
                            >
                                Load more replies ({hiddenReplyCount})
                            </Button>
                        </div>
                    )}

                    {visibleReplies.map((reply) => (
                        <div
                            key={reply.id}
                            className="
                                relative
                                before:absolute
                                before:-left-6
                                before:top-0
                                before:h-6
                                before:w-6
                                before:rounded-bl-[12px]
                                before:border-b
                                before:border-l
                                before:border-border
                            "
                        >
                            <CommentItem
                                comment={reply}
                                replyingToId={replyingToId}
                                canPin={canPin}
                                pinning={pinning}
                                onPin={onPin}
                                onReply={onReply}
                                onLike={onLike}
                                onRemove={onRemove}
                                onReport={onReport}
                                likingCommentId={likingCommentId}
                                removingCommentId={removingCommentId}
                                currentUserId={currentUserId}
                                currentRole={currentRole}
                                depth={depth + 1}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function CommentFrame({
    pinned,
    boosted,
    isOwnComment,
    children,
}: {
    pinned: boolean
    boosted: boolean
    isOwnComment: boolean
    children: ReactNode
}) {
    if (pinned) {
        return (
            <div
                className={`
                    rounded-[15px]
                    bg-gradient-to-br
                    from-orange-400
                    via-yellow-300
                    to-sky-400
                    p-px
                    ${
                        isOwnComment
                            ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background'
                            : ''
                    }
                `}
            >
                {children}
            </div>
        )
    }

    return (
        <div
            className={`
                rounded-[15px]
                border
                bg-background
                ${
                    isOwnComment
                        ? 'border-2 border-yellow-400'
                        : boosted
                          ? 'border-orange-400'
                          : 'border-border'
                }
            `}
        >
            {children}
        </div>
    )
}

function formatCompactCount(value: number) {
    return new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value)
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
        <Avatar className="mt-0.5 h-8 w-8 shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback className="bg-black text-[11px] font-semibold text-white">
                {initial}
            </AvatarFallback>
            {role === 'super_admin' && (
                <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-rose-600 p-0.5 text-white ring-2 ring-background">
                    <ShieldCheck className="h-2.5 w-2.5" />
                </span>
            )}
        </Avatar>
    )
}

function formatDate(value: string) {
    if (!value) return ''
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}
