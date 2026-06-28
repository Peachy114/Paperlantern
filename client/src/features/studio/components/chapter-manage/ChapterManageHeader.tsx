import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Plus } from 'lucide-react'

interface Props {
    workTitle?: string
    workType?: string
    workSlug: string
    navigate: (path: string) => void
}

export default function ChapterManageHeader({ workTitle, workType, workSlug, navigate }: Props) {
    return (
        <div className="space-y-4">
            <button
                onClick={() => navigate('/studio')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to Studio
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight break-all">
                            {workTitle ?? 'Chapters'}
                        </h1>
                        {workType && (
                            <Badge variant="secondary" className="capitalize text-xs shrink-0">
                                {workType}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Manage and organize your chapters
                    </p>
                </div>

                <Button
                    onClick={() => navigate(`/studio/works/${workSlug}/chapters/create`)}
                    size="sm"
                    className="shrink-0 w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    New Chapter
                </Button>
            </div>

            <Separator />
        </div>
    )
}
