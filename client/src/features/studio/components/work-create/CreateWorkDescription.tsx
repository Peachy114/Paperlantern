import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import FieldError from '@/components/ui/FieldError'

interface CreateWorkDescriptionProps {
    value: string
    onChange: (e: any) => void
    error: boolean
    fieldErrors: Record<string, string>
}

export default function CreateWorkDescription({
    value,
    onChange,
    error,
    fieldErrors,
}: CreateWorkDescriptionProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label>
                Description <span className="text-red-400">*</span>
            </Label>
            <Textarea
                name="description"
                value={value}
                onChange={onChange}
                rows={4}
                maxLength={300}
                placeholder="Write a synopsis..."
                className={error ? 'border-red-400 resize-none' : 'resize-none'}
            />
            <div
                className={`text-right text-[11px] ${value.length >= 290 ? 'text-red-400' : 'text-muted-foreground'}`}
            >
                {value.length}/300
            </div>
            <FieldError fieldErrors={fieldErrors} field="description" />
        </div>
    )
}
