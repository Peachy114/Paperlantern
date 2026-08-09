import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Service form fields ----
export function NumberField({ label, value, onChange }: {
    label: string
    value: number
    onChange: (value: number) => void
}) {
    return (
        <div>
            <Label>{label}</Label>
            <Input type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        </div>
    )
}

export function SelectField({ label, value, options, onChange }: {
    label: string
    value: string
    options: Array<[string, string]>
    onChange: (value: string) => void
}) {
    return (
        <div>
            <Label>{label}</Label>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
                {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
            </select>
        </div>
    )
}

export function RadioCard({ checked, title, description, onChange }: {
    checked: boolean
    title: string
    description: string
    onChange: () => void
}) {
    return (
        <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition ${checked ? 'border-foreground bg-muted/50' : 'bg-background hover:bg-muted/30'}`}>
            <input type="radio" checked={checked} onChange={onChange} className="mt-1 h-4 w-4" />
            <span>
                <span className="block font-semibold uppercase">{title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
            </span>
        </label>
    )
}

export function ToggleLine({ label, checked, onChange }: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            <span>{label}</span>
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
        </label>
    )
}
