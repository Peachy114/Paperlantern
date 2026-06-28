import { Heart } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function AboutFooter() {
    return (
        <div className="mt-8">
            <Separator className="mb-4" />
            <div className="flex items-center justify-between text-xs text-muted-foreground/50 uppercase tracking-widest">
                <span>Later N Comix Publishing</span>
                <span className="flex items-center gap-1 normal-case tracking-normal text-muted-foreground/60">
                    <Heart className="w-3 h-3" /> made by devOrbit
                </span>
                <span>© 2026</span>
            </div>
        </div>
    )
}
