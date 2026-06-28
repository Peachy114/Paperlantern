import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FieldError from '@/components/ui/FieldError'

interface CreateWorkTitleProps {
    value: string
    onChange: (e: any) => void
    error: boolean
    fieldErrors: Record<string, string>
}

const MAX = 100

export default function CreateWorkTitle({
    value,
    onChange,
    error,
    fieldErrors,
}: CreateWorkTitleProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label>
                Title <span className="text-red-400">*</span>
            </Label>
            <Input
                name="title"
                value={value}
                onChange={onChange}
                placeholder="Enter title"
                maxLength={100}
                className={error ? 'border-red-400' : ''}
            />
            <div className="flex items-center justify-between">
                <FieldError fieldErrors={fieldErrors} field="title" />
                <span
                    className={`text-xs ml-auto ${value.length >= MAX ? 'text-red-400' : 'text-muted-foreground'}`}
                >
                    {value.length}/{MAX}
                </span>
            </div>
        </div>
    )
}
