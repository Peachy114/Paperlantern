import { storageUrl } from '@/utils/storage'
import { Badge } from '@/components/ui/badge'
import type { ConfirmAction } from './StudioTrashView'
import { MoreHorizontal } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Work {
    slug: string
    title: string
    type: 'webtoon' | 'wattpad'
    cover: string | null
    deleted_at: string
}

interface Props {
    work: Work
    daysLeft: number
    onSetConfirm: (action: ConfirmAction) => void
}

export default function StudioTrashWorkRow({ work, daysLeft, onSetConfirm }: Props) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors">
            <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-muted">
                {work.cover ? (
                    <img
                        src={storageUrl(work.cover)!}
                        alt={work.title}
                        className="w-full h-full object-cover grayscale opacity-60"
                    />
                ) : (
                    <div className="w-full h-full bg-muted" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate line-through text-muted-foreground max-w-[180px]">
                    {work.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-xs capitalize">
                        {work.type === 'webtoon' ? 'Webtoon' : 'Novel'}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={`text-xs ${daysLeft <= 3 ? 'text-red-500 border-red-300' : ''}`}
                    >
                        {daysLeft}d left
                    </Badge>
                </div>
            </div>

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={() =>
                            onSetConfirm({
                                type: 'restore-work',
                                slug: work.slug,
                                title: work.title,
                            })
                        }
                    >
                        Restore
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={() =>
                            onSetConfirm({ type: 'force-work', slug: work.slug, title: work.title })
                        }
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
