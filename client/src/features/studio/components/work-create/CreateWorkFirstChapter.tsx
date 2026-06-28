import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface CreateWorkFirstChapterProps {
    chapterTitle: string
    chapterStatus: string
    onChapterTitleChange: (e: any) => void
    onChapterStatusChange: (e: any) => void
    requiresChapter: boolean
    chapterFieldErrors: Record<string, string>
}

export default function CreateWorkFirstChapter({
    chapterTitle,
    chapterStatus,
    onChapterTitleChange,
    onChapterStatusChange,
    requiresChapter,
    chapterFieldErrors,
}: CreateWorkFirstChapterProps) {
    return (
        <div>
            {/* Header */}
            <div className="mb-5">
                <p className="font-medium text-foreground">
                    First chapter <span className="text-red-400">*</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Ongoing and completed works need at least 1 published chapter.
                </p>
            </div>

            {/* Title and Status Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Chapter Title */}
                <div className="flex flex-col gap-1.5">
                    <Label>
                        Chapter title <span className="text-red-400">*</span>
                    </Label>
                    <Input
                        name="title"
                        value={chapterTitle}
                        onChange={onChapterTitleChange}
                        placeholder="Chapter title"
                        className={chapterFieldErrors.title ? 'border-red-400' : ''}
                    />
                    {chapterFieldErrors.title && (
                        <p className="text-xs text-red-400">{chapterFieldErrors.title}</p>
                    )}
                </div>

                {/* Chapter Status */}
                <div className="flex flex-col gap-1.5">
                    <Label>Status</Label>
                    <Select
                        value={chapterStatus}
                        disabled={requiresChapter}
                        onValueChange={(val) =>
                            onChapterStatusChange({
                                target: { name: 'status', value: val },
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {!requiresChapter && <SelectItem value="draft">Draft</SelectItem>}
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
