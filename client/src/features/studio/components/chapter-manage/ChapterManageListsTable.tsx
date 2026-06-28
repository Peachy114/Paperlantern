import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import ChapterManageLists from './ChapterManageLists'

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

export default function ChapterManageTable({ chapters, workSlug, navigate, onDelete }: Props) {
    if (chapters.length === 0) {
        return (
            <Card className="shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <p className="text-muted-foreground text-sm">No chapters yet.</p>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/studio/works/${workSlug}/chapters/create`)}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add first chapter
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-none">
            <CardHeader className="pb-0 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Chapter List
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2">
                <ChapterManageLists
                    chapters={chapters}
                    workSlug={workSlug}
                    navigate={navigate}
                    onDelete={onDelete}
                />

                <div className="px-4 py-2.5 border-t flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} total
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
