import { useEffect, useRef } from 'react'
import { Bold, Heading2, Italic, List, ListOrdered, Underline } from 'lucide-react'

export default function NewsRichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value }, [value])
    const command = (name: string, argument?: string) => {
        ref.current?.focus()
        document.execCommand(name, false, argument)
        onChange(ref.current?.innerHTML ?? '')
    }
    const tools = [
        ['Heading', Heading2, () => command('formatBlock', 'h2')],
        ['Bold', Bold, () => command('bold')],
        ['Italic', Italic, () => command('italic')],
        ['Underline', Underline, () => command('underline')],
        ['Bullets', List, () => command('insertUnorderedList')],
        ['Numbered list', ListOrdered, () => command('insertOrderedList')],
    ] as const
    return <div className="overflow-hidden rounded-xl border bg-background">
        <div className="flex flex-wrap gap-1 border-b bg-muted/60 p-2">
            {tools.map(([label, Icon, action]) => <button key={label} type="button" title={label} aria-label={label} onMouseDown={(e) => { e.preventDefault(); action() }} className="grid size-9 place-items-center rounded-lg hover:bg-background"><Icon className="size-4" /></button>)}
        </div>
        <div ref={ref} contentEditable suppressContentEditableWarning onInput={() => onChange(ref.current?.innerHTML ?? '')} className="news-rich-content min-h-64 p-4 outline-none" data-placeholder="Write the full News details…" />
    </div>
}
