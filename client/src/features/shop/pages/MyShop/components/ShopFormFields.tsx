import type { ChangeEvent } from 'react'
import { Label } from '@/components/ui/label'

export function SelectField({
    label,
    value,
    values,
    onChange,
}: {
    label: string
    value: string
    values: string[]
    onChange: (value: string) => void
}) {
    return (
        <div>
            <Label>{label}</Label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
                {values.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>
        </div>
    )
}

export function FileInput({
    label,
    multiple,
    accept,
    onChange,
}: {
    label: string
    multiple?: boolean
    accept?: string
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <label className="block cursor-pointer rounded-lg border border-dashed p-4 text-sm transition hover:bg-muted/50">
            <span className="font-medium">{label}</span>
            <input
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={onChange}
                className="mt-2 block w-full text-xs text-muted-foreground"
            />
        </label>
    )
}