import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Commission rich text ----
export function CommissionRichTextBlock({
    label,
    value,
    onChange,
    onFormat,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    onFormat: (prefix: string, suffix?: string) => void
}) {
    return (
        <div>
            <div className="flex items-center justify-between gap-2">
                <Label>{label}</Label>
                <div className="flex gap-1">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onFormat('## ')}
                    >
                        H
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onFormat('**', '**')}
                    >
                        B
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onFormat('- ')}
                    >
                        Bullet
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onFormat('||', '||')}
                    >
                        Spoiler
                    </Button>
                </div>
            </div>
            <Textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 min-h-32"
            />
            <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Live preview
                </p>
                <CommissionRichTextPreview value={value} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
                Supports simple markdown-style headings, bold text, bullets, and spoiler highlights.
            </p>
        </div>
    )
}

export function CommissionRichTextPreview({ value }: { value: string }) {
    const lines = value.trim() ? value.split(/\r?\n/) : ['Preview text will appear here.']

    return (
        <div className="space-y-1 text-sm leading-relaxed text-foreground">
            {lines.map((line, index) => {
                const content = line.replace(/^#{1,3}\s+/, '').replace(/^-\s+/, '')
                const inline = renderInlineRichText(content, index)

                if (/^#{1,3}\s+/.test(line)) {
                    return (
                        <h3 key={index} className="text-base font-bold">
                            {inline}
                        </h3>
                    )
                }

                if (/^-\s+/.test(line)) {
                    return (
                        <div key={index} className="flex gap-2">
                            <span className="mt-0.5 text-muted-foreground">•</span>
                            <span>{inline}</span>
                        </div>
                    )
                }

                return <p key={index}>{inline}</p>
            })}
        </div>
    )
}

function renderInlineRichText(text: string, lineIndex: number): ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*|\|\|[^|]+\|\|)/g)

    return parts.map((part, index) => {
        const key = `${lineIndex}-${index}`
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={key}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('||') && part.endsWith('||')) {
            return (
                <span key={key} className="rounded bg-yellow-200 px-1 text-yellow-950">
                    {part.slice(2, -2)}
                </span>
            )
        }

        return <span key={key}>{part}</span>
    })
}
