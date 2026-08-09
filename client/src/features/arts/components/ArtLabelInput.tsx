import type { KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { publicApi } from '@/api/public'

// Art label editor ----
export function ArtLabelInput({ labels, input, onInputChange, onChange }: {
    labels: string[]
    input: string
    onInputChange: (value: string) => void
    onChange: (labels: string[]) => void
}) {
    const suggestions = useQuery({ queryKey: ['art-tags', input], queryFn: () => publicApi.getArtTags(input).then((res) => res.data), staleTime: 60 * 1000 })
    const addLabel = (raw: string) => {
        const label = raw.trim().toLowerCase()
        if (!label || labels.includes(label) || labels.length >= 12) return
        onChange([...labels, label])
        onInputChange('')
    }
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter' && event.key !== ',') return
        event.preventDefault()
        addLabel(input)
    }
    const filteredSuggestions = (suggestions.data ?? []).filter((tag: { label: string }) => !labels.includes(tag.label.toLowerCase()))

    return (
        <div className="grid gap-2">
            <div className="min-h-10 rounded-md border bg-background px-2 py-1.5"><div className="flex flex-wrap items-center gap-1.5">
                {labels.map((label) => <span key={label} className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-xs">{label}<button type="button" onClick={() => onChange(labels.filter((item) => item !== label))} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button></span>)}
                <input id="art-labels" value={input} placeholder={labels.length === 0 ? 'Type a label and press Enter' : ''} onChange={(event) => onInputChange(event.target.value)} onKeyDown={handleKeyDown} className="min-w-40 flex-1 bg-transparent text-sm outline-none" />
            </div></div>
            <p className="text-xs text-muted-foreground">Add up to 12 labels. Press Enter or comma after each label.</p>
            {filteredSuggestions.length > 0 && <div className="flex flex-wrap gap-1.5">{filteredSuggestions.slice(0, 8).map((tag: { label: string; artists_count: number }) => <button key={tag.label} type="button" onClick={() => addLabel(tag.label)} className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground">{tag.label} · {tag.artists_count} artists</button>)}</div>}
        </div>
    )
}
