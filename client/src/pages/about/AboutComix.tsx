import { BookMarked } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export interface ComixType {
    emoji: string
    title: string
    text: string
}

interface AboutComixProps {
    types: ComixType[]
}

export function AboutComix({ types }: AboutComixProps) {
    return (
        <Card className="border border-border shadow-none rounded-lg mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                        <BookMarked className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-medium">Comix</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Read and publish stories
                        </p>
                    </div>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {types.map((type) => (
                        <div
                            key={type.title}
                            className="rounded-md border border-border bg-muted/30 px-4 py-3 space-y-1"
                        >
                            <span className="text-xl">{type.emoji}</span>
                            <p className="text-sm font-medium">{type.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {type.text}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
