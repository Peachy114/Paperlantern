import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    workType: 'webtoon' | 'wattpad'
    onBack: () => void
}

export default function ChapterCreateHeader({ workType, onBack }: Props) {
    return (
        <div className="flex flex-col gap-4">
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to chapters
            </Button>
            <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                    {workType === 'webtoon' ? 'Webtoon' : 'Novel'}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    New chapter
                </h1>
            </div>
        </div>
    )
}
