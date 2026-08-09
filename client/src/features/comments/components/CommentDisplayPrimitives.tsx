import { Gift, Glasses, Rocket, ShieldCheck, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { storageUrl } from '@/utils/storage'
import type { PublicComment } from '@/types/comment'

// Comment formatting ----
export function formatCompactCommentCount(value: number) {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatCommentDate(value: string) {
    if (!value) return ''
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function commentAwardIcon(icon: string) {
    if (icon === 'rocket') return Rocket
    if (icon === 'glasses') return Glasses
    if (icon === 'star') return Star
    return Gift
}

// Comment avatar ----
export function CommentAvatar({ name, avatar, role }: { name: string; avatar: string | null; role?: 'super_admin' | 'storyteller' | 'wanderer' }) {
    const avatarUrl = avatar ? storageUrl(avatar) : null
    return <Avatar className="mt-0.5 h-8 w-8 shrink-0">{avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}<AvatarFallback className="bg-black text-[11px] font-semibold text-white">{name[0]?.toUpperCase() ?? 'U'}</AvatarFallback>{role === 'super_admin' && <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-rose-600 p-0.5 text-white ring-2 ring-background"><ShieldCheck className="h-2.5 w-2.5" /></span>}</Avatar>
}

// Comment media ----
export function CommentMedia({ comment }: { comment: PublicComment }) {
    return <div className="mt-3 flex flex-wrap gap-3">{comment.sticker && <div className="h-[150px] w-[150px] bg-transparent p-1"><img src={storageUrl(comment.sticker.image_path)!} alt={comment.sticker.name} draggable={false} onContextMenu={(event) => event.preventDefault()} className="h-full w-full select-none object-contain" /></div>}{comment.gif_url && <a href={comment.gif_url} target="_blank" rel="noreferrer" className="block max-w-[320px] overflow-hidden rounded-lg bg-muted"><img src={comment.gif_url} alt="Comment GIF" draggable={false} onContextMenu={(event) => event.preventDefault()} className="max-h-56 w-full select-none object-contain" /></a>}{comment.image_url && <a href={comment.image_url} target="_blank" rel="noreferrer" className="block max-w-[320px] overflow-hidden rounded-lg bg-muted"><img src={comment.image_url} alt="Comment attachment" draggable={false} onContextMenu={(event) => event.preventDefault()} className="max-h-56 w-full select-none object-contain" /></a>}{comment.image_path && <div className="block max-w-[320px] overflow-hidden rounded-lg bg-muted"><img src={storageUrl(comment.image_path)!} alt="Comment upload" draggable={false} onContextMenu={(event) => event.preventDefault()} className="max-h-56 w-full select-none object-contain" /></div>}</div>
}
