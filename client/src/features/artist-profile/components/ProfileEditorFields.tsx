import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { isColorValue } from '@/features/artist-profile/utils/profileLayout'
import { ProfileFieldMessage as FieldMessage } from '@/features/artist-profile/components/ProfileFormPrimitives'

// Profile editor section ----
export function ProfileEditSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
    return <details className="group rounded-lg border bg-background/70 p-3" open={defaultOpen}><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><span>{title}</span><span className="text-base leading-none group-open:hidden">+</span><span className="hidden text-base leading-none group-open:inline">-</span></summary><div className="mt-3 grid gap-3">{children}</div></details>
}

// Profile color field ----
export function ColorField({ label, value, fallback, error, onChange }: { label: string; value: string; fallback: string; error?: string; onChange: (value: string) => void }) {
    const color = isColorValue(value) ? value : fallback
    return <label className="grid gap-1 text-sm"><span>{label}</span>{error && <FieldMessage>{error}</FieldMessage>}<div className="flex gap-2"><Input type="color" value={color} onChange={(event) => onChange(event.target.value)} className="h-8 w-12 shrink-0 p-1" /><Input value={value} placeholder={fallback} onChange={(event) => onChange(event.target.value)} /></div></label>
}
