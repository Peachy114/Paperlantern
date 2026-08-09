import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

// Select field ----
export function ProfileSelectField({
    label,
    value,
    options,
    formatOption,
    onChange,
}: {
    label: string
    value: string
    options: string[]
    formatOption?: (option: string) => string
    onChange: (value: string) => void
}) {
    return (
        <label className="grid gap-1 text-sm">
            <span>{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {formatOption ? formatOption(option) : option}
                    </option>
                ))}
            </select>
        </label>
    )
}

// Validation message ----
export function ProfileFieldMessage({ children }: { children: ReactNode }) {
    return <p className="text-xs font-medium text-red-500">{children}</p>
}

// Range field ----
export function ProfileRangeField({
    label,
    value,
    min,
    max,
    suffix,
    error,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    suffix: string
    error?: string
    onChange: (value: number) => void
}) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="flex items-center justify-between gap-2">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">
                    {Math.round(value)}
                    {suffix}
                </span>
            </span>
            {error && <ProfileFieldMessage>{error}</ProfileFieldMessage>}
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="w-full accent-foreground"
            />
        </label>
    )
}

// Empty state ----
export function ProfileEmptyPanel({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="rounded-lg border py-16 text-center">
            <Icon className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    )
}
