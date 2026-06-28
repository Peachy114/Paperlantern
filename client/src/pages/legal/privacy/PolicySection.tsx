import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'

export interface PolicyItem {
    text: string
    warn: boolean
}

export interface PolicySectionProps {
    index: number
    title: string
    icon: LucideIcon
    items: PolicyItem[]
}

export function PolicySection({ index, title, icon: Icon, items }: PolicySectionProps) {
    return (
        <Card className="border border-border shadow-none rounded-lg">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-sm font-medium">
                        <span className="text-muted-foreground mr-2 font-normal tabular-nums">
                            {String(index).padStart(2, '0')}
                        </span>
                        {title}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className={`flex gap-2.5 items-start text-sm leading-relaxed rounded-md px-3 py-2 ${
                            item.warn
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                                : 'text-muted-foreground'
                        }`}
                    >
                        {item.warn ? (
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                        ) : (
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-border shrink-0" />
                        )}
                        <span>{item.text}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
