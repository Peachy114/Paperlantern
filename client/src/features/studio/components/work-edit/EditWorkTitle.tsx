import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import FieldError from '@/components/ui/FieldError'

interface EditWorkTitleProps {
    title: string
    description: string
    onTitleChange: (e: any) => void
    onDescriptionChange: (e: any) => void
    titleError: boolean
    descriptionError: boolean
    fieldErrors: Record<string, string>
}

export default function EditWorkTitle({
    title,
    description,
    onTitleChange,
    onDescriptionChange,
    titleError,
    descriptionError,
    fieldErrors,
}: EditWorkTitleProps) {
    return (
        <>
            {/* Title */}
            <div className="flex flex-col gap-1.5">
                <Label>
                    Title <span className="text-red-400">*</span>
                </Label>
                <Input
                    name="title"
                    value={title}
                    onChange={onTitleChange}
                    maxLength={100}
                    placeholder="Enter title"
                    className={titleError ? 'border-red-400' : ''}
                />
                <div className="flex items-center justify-between">
                    <FieldError fieldErrors={fieldErrors} field="title" />
                    <span
                        className={`text-xs ml-auto ${title.length >= 100 ? 'text-red-400' : 'text-muted-foreground'}`}
                    >
                        {title.length}/100
                    </span>
                </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
                <Label>
                    Description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                    name="description"
                    value={description}
                    onChange={onDescriptionChange}
                    rows={4}
                    maxLength={300}
                    placeholder="Write a synopsis..."
                    className={descriptionError ? 'border-red-400 resize-none' : 'resize-none'}
                />
                <div
                    className={`text-right text-[11px] ${
                        description.length >= 290 ? 'text-red-400' : 'text-muted-foreground'
                    }`}
                >
                    {description.length}/300
                </div>
                <FieldError fieldErrors={fieldErrors} field="description" />
            </div>
        </>
    )
}
