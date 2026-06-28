import { BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function AboutOrigin() {
    return (
        <Card className="border border-border shadow-none rounded-lg mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-sm font-medium">How It Started</CardTitle>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                    Later N Comix started as a side project by{' '}
                    <span className="font-medium text-foreground">devOrbit</span> — a small team of
                    developers and artists who kept asking the same question:
                </p>
                <blockquote className="border-l-2 border-border pl-4 italic text-foreground/70">
                    "Why is it so hard for indie artists to share their work online?"
                </blockquote>
                <p>
                    So we built the answer. A platform where webtoon artists, novel writers, and
                    storytellers of all kinds can publish freely, build an audience, and connect
                    with readers who genuinely care.
                </p>
                <p>No gatekeeping. No algorithms burying your work. Just your story, your way.</p>
            </CardContent>
        </Card>
    )
}
