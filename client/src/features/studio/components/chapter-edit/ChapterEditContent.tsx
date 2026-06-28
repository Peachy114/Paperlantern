import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ChapterEditContentProps {
    content: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export function ChapterEditContent({ content, onChange }: ChapterEditContentProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
                <Label className="text-sm font-medium">Story content</Label>
                <span className="text-xs text-muted-foreground">
                    {content.length.toLocaleString()} chars
                </span>
            </div>
            <Textarea
                name="content"
                value={content}
                onChange={onChange}
                rows={20}
                placeholder="Write your story here…"
                className="resize-none leading-relaxed text-sm font-[Georgia,serif] placeholder:font-sans"
            />
        </div>
    )
}
