import { storageUrl } from '@/utils/storage'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Clock, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import ChapterManageListActionMenu from './ChapterManageListActionMenu'

type Chapter = {
    slug: string
    title: string
    order: number
    status: string
    cover?: string | null
    views: number
    likes?: number
    is_locked?: boolean
    credits_required?: number
    scheduled_at?: string | null
    created_at: string
}

interface Props {
    chapters: Chapter[]
    workSlug: string
    navigate: (path: string) => void
    onDelete: (slug: string) => void
}

const STATUS_CONFIG: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; dot: string }
> = {
    published: { label: 'Published', variant: 'default', dot: 'bg-emerald-500' },
    scheduled: { label: 'Scheduled', variant: 'secondary', dot: 'bg-amber-400' },
    draft: { label: 'Draft', variant: 'outline', dot: 'bg-zinc-400' },
}

const STATUS_ROW_ACCENT: Record<string, string> = {
    published: 'border-l-emerald-500',
    scheduled: 'border-l-amber-400',
    draft: 'border-l-zinc-300',
}

export default function ChapterManageLists({ chapters, workSlug, navigate, onDelete }: Props) {
    return (
        <>
            {/* Mobile: image, title, date, FREE/credits, 3-dot menu */}
            <div className="sm:hidden divide-y">
                {chapters.map((chapter) => {
                    const dateLabel = new Date(chapter.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                    })
                    const lockLabel = chapter.is_locked
                        ? `${chapter.credits_required ?? 0} CR`
                        : 'FREE'

                    return (
                        <div key={chapter.slug} className="flex items-center gap-3 py-3 px-4">
                            {/* Cover */}
                            <div className="w-14 h-20 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                {chapter.cover ? (
                                    <img
                                        src={storageUrl(chapter.cover)!}
                                        alt={chapter.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                )}
                            </div>

                            {/* Title + date + FREE/credits */}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">{chapter.title}</p>
                                <p className="text-xs text-sky-400 mt-1">{dateLabel}</p>
                                <p
                                    className={
                                        chapter.is_locked
                                            ? 'text-sm font-bold text-amber-500 mt-1.5'
                                            : 'text-sm font-bold text-foreground mt-1.5'
                                    }
                                >
                                    {lockLabel}
                                </p>
                            </div>

                            {/* 3-dot menu */}
                            <ChapterManageListActionMenu
                                chapter={chapter}
                                workSlug={workSlug}
                                navigate={navigate}
                                onDelete={onDelete}
                            />
                        </div>
                    )
                })}
            </div>

            {/* Desktop / tablet: table layout */}
            <div className="hidden sm:block overflow-x-auto">
                <Table className="min-w-[480px]">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="w-8 pl-4">#</TableHead>
                            <TableHead>Chapter</TableHead>
                            <TableHead className="hidden sm:table-cell">Status</TableHead>
                            <TableHead className="hidden md:table-cell text-right">Views</TableHead>
                            <TableHead className="hidden md:table-cell text-right">Likes</TableHead>
                            <TableHead className="sticky right-0 w-12 min-w-[48px] pr-3 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {chapters.map((chapter, i) => {
                            const status = STATUS_CONFIG[chapter.status] ?? {
                                label: chapter.status,
                                variant: 'outline' as const,
                                dot: 'bg-zinc-400',
                            }
                            const accent = STATUS_ROW_ACCENT[chapter.status] ?? 'border-l-zinc-200'

                            return (
                                <TableRow
                                    key={chapter.slug}
                                    className={cn(
                                        'border-l-2 hover:bg-muted/40 transition-colors',
                                        accent
                                    )}
                                >
                                    {/* Index */}
                                    <TableCell className="pl-4 text-xs text-muted-foreground tabular-nums w-8">
                                        {String(i + 1).padStart(2, '0')}
                                    </TableCell>

                                    {/* Cover + title */}
                                    <TableCell className="max-w-[140px] sm:max-w-none">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-7 h-10 sm:w-8 sm:h-11 shrink-0 rounded-sm overflow-hidden bg-muted flex items-center justify-center">
                                                {chapter.cover ? (
                                                    <img
                                                        src={storageUrl(chapter.cover)!}
                                                        alt={chapter.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    Ch.{chapter.order} · {chapter.title}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <span className="sm:hidden">
                                                        <Badge
                                                            variant={status.variant}
                                                            className="text-xs h-5"
                                                        >
                                                            {status.label}
                                                        </Badge>
                                                    </span>

                                                    {chapter.is_locked && (
                                                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                                            <Lock className="h-3 w-3" />
                                                            {chapter.credits_required}cr
                                                        </span>
                                                    )}
                                                    {chapter.scheduled_at && (
                                                        <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(
                                                                chapter.scheduled_at
                                                            ).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Status badge */}
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant={status.variant} className="text-xs gap-1.5">
                                            <span
                                                className={cn(
                                                    'h-1.5 w-1.5 rounded-full',
                                                    status.dot
                                                )}
                                            />
                                            {status.label}
                                        </Badge>
                                    </TableCell>

                                    {/* Views */}
                                    <TableCell className="hidden md:table-cell text-right text-sm tabular-nums text-muted-foreground">
                                        {chapter.views.toLocaleString()}
                                    </TableCell>

                                    {/* Likes */}
                                    <TableCell className="hidden md:table-cell text-right text-sm tabular-nums text-muted-foreground">
                                        {(chapter.likes ?? 0).toLocaleString()}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="sticky right-0 text-right pr-3 min-w-[48px] shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)]">
                                        <ChapterManageListActionMenu
                                            chapter={chapter}
                                            workSlug={workSlug}
                                            navigate={navigate}
                                            onDelete={onDelete}
                                        />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}
