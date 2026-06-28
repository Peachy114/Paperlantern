import { Palette } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export interface ArtistCard {
    emoji: string
    title: string
    text: string
}

interface AboutArtistsProps {
    cards: ArtistCard[]
}

export function AboutArtists({ cards }: AboutArtistsProps) {
    return (
        <Card className="border border-border shadow-none rounded-lg mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-medium">Artists</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Post your work, get discovered, take commissions
                        </p>
                    </div>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {cards.map((card) => (
                        <div
                            key={card.title}
                            className="rounded-md border border-border bg-muted/30 px-4 py-3 space-y-1"
                        >
                            <span className="text-xl">{card.emoji}</span>
                            <p className="text-sm font-medium">{card.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {card.text}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
