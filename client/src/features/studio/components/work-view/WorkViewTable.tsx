// features/studio/components/work-view/WorkViewTable.tsx
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Heart, Trash2, MoreHorizontal, BookOpen, Pencil, Sparkles } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
    draft: 'text-gray-400',
    scheduled: 'text-yellow-500',
    published: 'text-green-500',
    ongoing: 'text-sky-500',
}

export interface Work {
    id: string
    slug: string
    title: string
    type: 'webtoon' | 'wattpad'
    status: 'draft' | 'ongoing' | 'completed' | 'hiatus'
    cover: string | null
    chapters_count: number
    views: number
    likes: number
    genres: string[]
    created_at: string
    boosted_until?: string | null
}

interface WorkViewTableProps {
    works: Work[]
    selectedSlugs: string[]
    onSelectWork: (slug: string) => void
    onNavigate: (path: string) => void
    onDeleteRequest: (slug: string) => void
    onBoostRequest: (work: Work) => void
    onCreateFirst: () => void
}

export default function WorkViewTable({
    works,
    selectedSlugs,
    onSelectWork,
    onNavigate,
    onDeleteRequest,
    onBoostRequest,
    onCreateFirst,
}: WorkViewTableProps) {
    if (works.length === 0) {
        return (
            <div className="py-16 text-center">
                <p className="text-muted-foreground text-sm mb-4">No works yet</p>
                <Button onClick={onCreateFirst}>Create your first work</Button>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Chapters</TableHead>
                    <TableHead className="hidden sm:table-cell">Views</TableHead>
                    <TableHead className="hidden sm:table-cell">Likes</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {works.map((work) => {
                    const statusColor = STATUS_COLOR[work.status] ?? 'text-gray-400'
                    return (
                        <TableRow
                            key={work.slug}
                            className="cursor-pointer"
                            onClick={() => onNavigate(`/studio/works/${work.slug}/chapters`)}
                        >
                            <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selectedSlugs.includes(work.slug)}
                                    onChange={() => onSelectWork(work.slug)}
                                    className="h-4 w-4 rounded border-muted-foreground/40"
                                    aria-label={`Select ${work.title}`}
                                />
                            </TableCell>
                            <TableCell>
                                <div>
                                    <p className="font-medium text-sm leading-snug truncate max-w-[200px]">
                                        {work.title}
                                    </p>
                                    {work.boosted_until && (
                                        <p className="mt-0.5 text-[11px] text-amber-500">
                                            Boosted until{' '}
                                            {new Date(work.boosted_until).toLocaleDateString()}
                                        </p>
                                    )}
                                    {/* Mobile: show stats inline */}
                                    <p className="sm:hidden text-xs text-muted-foreground mt-0.5">
                                        <span className={`${statusColor} capitalize`}>
                                            {work.status}
                                        </span>
                                        {' · '}
                                        {work.chapters_count} ch · {work.views.toLocaleString()}{' '}
                                        views
                                    </p>
                                    {work.genres && work.genres.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {work.genres.slice(0, 2).join(' · ')}
                                        </p>
                                    )}
                                </div>
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                                <span className={`text-xs font-medium ${statusColor} capitalize`}>
                                    ✦ {work.status.charAt(0).toUpperCase() + work.status.slice(1)}
                                </span>
                            </TableCell>

                            <TableCell className="hidden sm:table-cell text-sm">
                                {work.chapters_count}
                            </TableCell>

                            <TableCell className="hidden sm:table-cell text-sm">
                                {work.views.toLocaleString()}
                            </TableCell>

                            <TableCell className="hidden sm:table-cell text-sm">
                                <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                                    {(work.likes ?? 0).toLocaleString()}
                                </span>
                            </TableCell>

                            <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal size={16} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() =>
                                                onNavigate(`/studio/works/${work.slug}/chapters`)
                                            }
                                        >
                                            <BookOpen size={14} className="mr-2" />
                                            Manage
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                onNavigate(`/studio/works/${work.slug}/edit`)
                                            }
                                        >
                                            <Pencil size={14} className="mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onBoostRequest(work)}>
                                            <Sparkles size={14} className="mr-2" />
                                            Boost
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setTimeout(() => onDeleteRequest(work.slug), 0)
                                            }}
                                            className="text-red-500 focus:text-red-500"
                                        >
                                            <Trash2 size={14} className="mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
