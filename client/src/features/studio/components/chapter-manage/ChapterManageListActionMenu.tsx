import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react'

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
    chapter: Chapter
    workSlug: string
    navigate: (path: string) => void
    onDelete: (slug: string) => void
}

export default function ChapterManageListActionMenu({
    chapter,
    workSlug,
    navigate,
    onDelete,
}: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={4} avoidCollisions={false}>
                <DropdownMenuItem
                    onClick={() =>
                        navigate(`/studio/works/${workSlug}/chapters/${chapter.slug}/show`)
                    }
                >
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    View
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() =>
                        navigate(`/studio/works/${workSlug}/chapters/${chapter.slug}/edit`)
                    }
                >
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => setTimeout(() => onDelete(chapter.slug), 0)}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
