import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
    BadgeCheck,
    ChevronLeft,
    Image as ImageIcon,
    MessageCircle,
    Paperclip,
    Settings2,
    Smile,
    StickyNote,
    X,
} from 'lucide-react'
import { feedsApi, type FeedPost } from '@/api/feeds'
import { artistProfileApi } from '@/api/artistProfile'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

const EMOJIS = ['👍', '😀', '😘', '😍', '😆', '😛', '😅', '😂', '😱', '🔥', '❤️', '😭']

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
        <main className="mx-auto max-w-3xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Feeds</h1>
                    <p className="text-sm text-muted-foreground">
                        Posts from you and creators you follow.
                    </p>
                </div>
                <Button onClick={() => setOpen(true)}>Create post</Button>
            </div>

            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        No feed posts yet.
                    </div>
                ) : (
                    posts.map((post) => <FeedCard key={post.id} post={post} />)
                )}
            </div>

            <CreatePostDialog
                open={open}
                onOpenChange={setOpen}
                onCreated={(post) => setPosts((current) => [post, ...current])}
            />
        </main>
    )
}

function FeedCard({ post }: { post: FeedPost }) {
    const avatar = post.user.avatar ? storageUrl(post.user.avatar) : null
    return (
        <article className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
                <Link
                    to={`/artists/${post.user.username}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold"
                >
                    {avatar ? <img src={avatar} className="h-full w-full object-cover" /> : post.user.name[0]}
                </Link>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <Link to={`/artists/${post.user.username}`} className="font-semibold">
                            {post.user.name}
                        </Link>
                        {post.user.artist_verified && <BadgeCheck className="h-4 w-4 text-sky-500" />}
                        <span className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleString()}
                        </span>
                    </div>
                    {post.body && <p className="mt-2 whitespace-pre-wrap text-sm">{post.body}</p>}
                    {post.sticker && (
                        <img
                            src={storageUrl(post.sticker.image_path)!}
                            alt={post.sticker.name}
                            className="mt-3 h-24 w-24 object-contain"
                        />
                    )}
                    {post.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {post.images.map((image) => (
                                <img
                                    key={image.id}
                                    src={storageUrl(image.image_path)!}
                                    alt=""
                                    className="aspect-video rounded-md object-cover"
                                />
                            ))}
                        </div>
                    )}
                    {post.attachment && <AttachmentCard attachment={post.attachment} />}
                    <div className="mt-3 flex items-center gap-5 text-sm text-muted-foreground">
                        <span>❤️ {post.likes_count}</span>
                        <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" /> {post.comments_count}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    )
}

function AttachmentCard({ attachment }: { attachment: NonNullable<FeedPost['attachment']> }) {
    return (
        <Link
            to={attachment.href}
            className="mt-3 flex max-w-md items-center gap-3 rounded-md border border-border bg-muted/20 p-2"
        >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                {attachment.image_path && (
                    <img src={storageUrl(attachment.image_path)!} alt="" className="h-full w-full object-cover" />
                )}
            </div>
            <div className="min-w-0">
                <p className="truncate font-semibold">{attachment.title}</p>
                <p className="text-sm text-muted-foreground">{attachment.subtitle}</p>
            </div>
        </Link>
    )
}

function CreatePostDialog({
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
    const [selectedAttachment, setSelectedAttachment] = useState<AttachOption | null>(null)
    const [panel, setPanel] = useState<'none' | 'emoji' | 'stickers' | 'attach' | 'settings' | 'rules'>('none')
    const [submitting, setSubmitting] = useState(false)
    const previews = useMemo(() => images.map((image) => URL.createObjectURL(image)), [images])

    useEffect(() => {
        if (!open) return
        artistProfileApi
            .stickerLibrary()
            .then((res) => {
                const all = [
                    ...(res.data.owned ?? []),
                    ...(res.data.subscribed ?? []),
                    ...(res.data.bought ?? []),
                ]
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

    const submit = async () => {
        setSubmitting(true)
        try {
            const form = new FormData()
            form.append('body', body)
            form.append('audience', audience)
            form.append('comments_enabled', commentsEnabled ? '1' : '0')
            images.forEach((image) => form.append('images[]', image))
            if (selectedSticker) form.append('sticker_id', selectedSticker.id)
            if (selectedAttachment?.type === 'work') form.append('attached_work_id', selectedAttachment.id)
            if (selectedAttachment?.type === 'art') form.append('attached_art_id', selectedAttachment.id)
            const res = await feedsApi.create(form)
            onCreated(res.data)
            setBody('')
            setImages([])
            setSelectedSticker(null)
            setSelectedAttachment(null)
            onOpenChange(false)
            toast.success('Post created.')
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Could not create post.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[94dvh] max-w-3xl overflow-hidden bg-[#171717] p-0 text-white" aria-describedby={undefined}>
                <div className="flex h-full flex-col">
                    <DialogHeader className="border-b border-white/15 px-5 py-3">
                        <div className="flex items-center justify-between">
                            <button onClick={() => onOpenChange(false)}><ChevronLeft /></button>
                            <DialogTitle>Create Post</DialogTitle>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setPanel(panel === 'settings' ? 'none' : 'settings')}><Settings2 /></button>
                                <button disabled={submitting} onClick={submit} className="font-semibold">Post</button>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="relative flex-1 overflow-hidden p-6">
                        <Textarea
                            value={body}
                            maxLength={1000}
                            onChange={(event) => setBody(event.target.value)}
                            placeholder="Share recent updates with your followers."
                            className="h-full resize-none border-0 bg-transparent p-0 text-lg text-white shadow-none focus-visible:ring-0"
                        />
                        <div className="absolute left-6 top-20 flex flex-wrap gap-3">
                            {selectedSticker && (
                                <div className="relative">
                                    <img src={storageUrl(selectedSticker.image_path)!} className="h-20 w-20 object-contain" />
                                    <button className="absolute -right-2 -top-2 rounded-full bg-white/20 p-1" onClick={() => setSelectedSticker(null)}><X className="h-3 w-3" /></button>
                                </div>
                            )}
                            {previews.map((src, index) => (
                                <div key={src} className="relative">
                                    <img src={src} className="h-20 w-28 rounded object-cover" />
                                    <button className="absolute -right-2 -top-2 rounded-full bg-white/20 p-1" onClick={() => setImages((current) => current.filter((_, i) => i !== index))}><X className="h-3 w-3" /></button>
                                </div>
                            ))}
                            {selectedAttachment && (
                                <div className="relative flex w-96 max-w-full items-center gap-3 rounded border border-white/20 bg-white/10 p-2">
                                    <div className="h-16 w-16 overflow-hidden rounded bg-white/10">
                                        {selectedAttachment.image_path && <img src={storageUrl(selectedAttachment.image_path)!} className="h-full w-full object-cover" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{selectedAttachment.title}</p>
                                        <p className="text-sm text-white/60">{selectedAttachment.subtitle}</p>
                                    </div>
                                    <button className="absolute right-2 top-2 rounded-full bg-white/20 p-1" onClick={() => setSelectedAttachment(null)}><X className="h-3 w-3" /></button>
                                </div>
                            )}
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
                                setSelectedAttachment={setSelectedAttachment}
                                audience={audience}
                                setAudience={setAudience}
                                commentsEnabled={commentsEnabled}
                                setCommentsEnabled={setCommentsEnabled}
                            />
                        )}
                    </div>
                    <div className="flex items-center justify-between border-t border-white/15 px-5 py-3">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setPanel(panel === 'emoji' ? 'none' : 'emoji')}><Smile /></button>
                            <button className="text-xs">GIF</button>
                            <button onClick={() => setPanel(panel === 'stickers' ? 'none' : 'stickers')}><StickyNote /></button>
                            <label className="cursor-pointer">
                                <ImageIcon />
                                <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => setImages((current) => [...current, ...Array.from(event.target.files ?? [])].slice(0, 10))} />
                            </label>
                            <button onClick={() => setPanel(panel === 'attach' ? 'none' : 'attach')}><Paperclip /></button>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="rounded border border-white/40 px-3 py-1" onClick={() => setPanel('rules')}>Rules</button>
                            <span className="text-sm text-white/60">{body.length}/1000</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function FloatingPanel(props: any) {
    if (props.panel === 'rules') {
        return (
            <div className="absolute bottom-6 left-6 max-w-sm rounded-lg bg-[#202020] p-5 shadow-xl">
                <h3 className="mb-4 text-lg font-bold">Community Guidelines</h3>
                <p className="whitespace-pre-line text-sm text-white/85">1. No spam or inappropriate advertisement.{'\n'}2. No nudity or illegal content.{'\n'}3. Do not share personal information without permission.{'\n'}4. Be respectful and do not post abusive or hateful content.</p>
                <Button className="mt-5 w-full" onClick={() => props.setPanel('none')}>OK</Button>
            </div>
        )
    }
    if (props.panel === 'settings') {
        return (
            <div className="absolute right-6 top-6 w-72 rounded-lg bg-[#202020] p-4 shadow-xl">
                <label className="flex items-center justify-between text-sm"><span>Audience</span><select className="rounded bg-[#333] px-2 py-1" value={props.audience} onChange={(e) => props.setAudience(e.target.value)}><option value="all">All</option><option value="followers">Followers</option></select></label>
                <label className="mt-3 flex items-center justify-between text-sm"><span>Enable comments</span><input type="checkbox" checked={props.commentsEnabled} onChange={(e) => props.setCommentsEnabled(e.target.checked)} /></label>
            </div>
        )
    }
    if (props.panel === 'emoji') {
        return <div className="absolute bottom-6 left-6 grid w-80 grid-cols-6 gap-3 rounded-lg bg-[#202020] p-4 text-2xl shadow-xl">{EMOJIS.map((emoji) => <button key={emoji} onClick={() => props.setBody((body: string) => `${body}${emoji}`)}>{emoji}</button>)}</div>
    }
    if (props.panel === 'stickers') {
        return <div className="absolute bottom-6 left-16 grid max-h-80 w-96 grid-cols-4 gap-3 overflow-auto rounded-lg bg-[#202020] p-4 shadow-xl">{props.stickers.map((sticker: StickerOption) => <button key={sticker.id} onClick={() => { props.setSelectedSticker(sticker); props.setPanel('none') }}><img src={storageUrl(sticker.image_path)!} className="h-16 w-16 object-contain" /></button>)}</div>
    }
    if (props.panel === 'attach') {
        return <div className="absolute bottom-6 left-24 max-h-96 w-96 overflow-auto rounded-lg bg-[#202020] p-4 shadow-xl"><p className="mb-3 text-sm text-white/60">Attach up to 1 series, art, or novel.</p>{props.attachments.map((item: AttachOption) => <button key={`${item.type}-${item.id}`} className="flex w-full items-center gap-3 rounded p-2 text-left hover:bg-white/10" onClick={() => { props.setSelectedAttachment(item); props.setPanel('none') }}><div className="h-14 w-14 overflow-hidden rounded bg-white/10">{item.image_path && <img src={storageUrl(item.image_path)!} className="h-full w-full object-cover" />}</div><span><b>{item.title}</b><br /><small className="text-white/60">{item.subtitle}</small></span></button>)}</div>
    }
    return null
}
