import { AlertTriangle } from 'lucide-react'

interface Item {
    text: string
    warn: boolean
}

interface Section {
    number: string
    title: string
    items: Item[]
}

interface Props {
    section: Section
}

export default function BecomeCreatorSection({ section }: Props) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground font-mono">{section.number}</span>
                <h2 className="text-sm md:text-base font-semibold">{section.title}</h2>
            </div>
            {section.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5">
                    {item.warn ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                        <span className="text-muted-foreground/40 text-xs mt-0.5 shrink-0">//</span>
                    )}
                    <p
                        className={`text-xs md:text-sm leading-relaxed ${item.warn ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}
                    >
                        {item.text}
                    </p>
                </div>
            ))}
        </div>
    )
}
