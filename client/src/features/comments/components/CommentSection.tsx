import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Gift,
    ImageOff,
    Loader2,
    MessageCircle,
    Send,
    Smile,
    Sticker,
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
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SuperLikeButton from './SuperLikeButton'

const EMOJIS = ['😀', '😍', '🔥', '👏', '😭', '❤️', '✨', '👀']

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
    const [emojiOpen, setEmojiOpen] = useState(false)
    const [stickerOpen, setStickerOpen] = useState(false)
    const [selectedSticker, setSelectedSticker] = useState<ArtistSticker | null>(null)
    const { token } = useAuthStore()
    const { openLogin } = useModalStore()
    const queryClient = useQueryClient()

    const commentsKey = ['comments', targetType, targetId, sort]

    const { data, isLoading } = useQuery({
        queryKey: commentsKey,
        queryFn: () => commentsApi.index(targetType, targetId, sort).then((res) => res.data),
    })

    const createMutation = useMutation({
        mutationFn: () =>
            commentsApi
                .create(targetType, targetId, {
                    body: body.trim() || undefined,
                    artist_sticker_id: selectedSticker?.id ?? null,
                })
                .then((res) => res.data),
        onSuccess: () => {
            setBody('')
            setSelectedSticker(null)
            queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not post comment.')
        },
    })

    const comments = data?.data ?? []

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!token) {
            openLogin()
            return
        }

        if (!body.trim() && !selectedSticker) {
            toast.error('Write a comment or choose a sticker.')
            return
        }

        createMutation.mutate()
    }

    return (
        <section className={compact ? 'space-y-4' : 'rounded-xl border bg-background p-4'}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <h2 className="text-base font-semibold">{title}</h2>
                    <span className="text-xs text-muted-foreground">({data?.total ?? 0})</span>
                </div>

                <div className="flex gap-1">
                    {(['all', 'latest', 'popular'] as CommentSort[]).map((nextSort) => (
                        <Button
                            key={nextSort}
                            type="button"
                            size="sm"
                            variant={sort === nextSort ? 'default' : 'outline'}
                            onClick={() => setSort(nextSort)}
                            className="capitalize"
                        >
                            {nextSort}
                        </Button>
                    ))}
                </div>
            </div>

            <form onSubmit={submit} className="mb-5 rounded-lg border bg-muted/10 p-3">
                {selectedSticker && (
                    <div className="relative mb-3 inline-flex h-[150px] w-[150px] items-center justify-center rounded-md bg-muted/20 p-2">
                        <img
                            src={storageUrl(selectedSticker.image_path)!}
                            alt={selectedSticker.name}
                            className="h-full w-full object-contain"
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

                <Textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Add a comment"
                    className="min-h-20 resize-none bg-background"
                />

                {emojiOpen && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => setBody((current) => `${current}${emoji}`)}
                                className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-lg hover:bg-muted"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={() => setEmojiOpen((open) => !open)}
                            title="Emoji"
                        >
                            <Smile className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={() => {
                                if (!token) openLogin()
                                else setStickerOpen(true)
                            }}
                            title="Stickers"
                        >
                            <Sticker className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        Send
                    </Button>
                </div>
            </form>

            {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading comments...</div>
            ) : comments.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center">
                    <MessageCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
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

function CommentItem({ comment }: { comment: PublicComment }) {
    return (
        <article className="rounded-lg border bg-background p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                        {comment.user?.name ?? 'Unknown'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {formatDate(comment.created_at)}
                    </p>
                </div>
                <SuperLikeButton
                    targetType="comment"
                    targetId={comment.id}
                    initialCount={comment.super_likes_count}
                    label=""
                    ownerUserId={comment.user?.id}
                />
            </div>

            {comment.body && <p className="whitespace-pre-wrap text-sm leading-6">{comment.body}</p>}

            {comment.sticker && (
                <div className="mt-3 inline-flex h-[150px] w-[150px] items-center justify-center rounded-md bg-muted/10 p-2">
                    <img
                        src={storageUrl(comment.sticker.image_path)!}
                        alt={comment.sticker.name}
                        className="h-full w-full object-contain"
                    />
                </div>
            )}
        </article>
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
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
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
                    <div key={sticker.id} className="flex h-full flex-col rounded-md bg-muted/10 p-2">
                        <button
                            type="button"
                            disabled={!canUse}
                            onClick={() => onSelect(sticker)}
                            className="h-[150px] rounded-md bg-muted/20 p-2 transition hover:bg-muted/40 disabled:opacity-60"
                            title={sticker.name}
                        >
                            <img
                                src={storageUrl(sticker.image_path)!}
                                alt={sticker.name}
                                className="h-full w-full object-contain"
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
