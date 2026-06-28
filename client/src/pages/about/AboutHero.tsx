import { Sparkles } from 'lucide-react'

export function AboutHero() {
    return (
        <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">
                    devOrbit × Later N Comix
                </span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight mb-3">Later N Comix</h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                A place built by creators, for creators. We believe every artist deserves a stage —
                whether you draw webtoons at 2am or write novels on your lunch break.
            </p>
        </div>
    )
}
