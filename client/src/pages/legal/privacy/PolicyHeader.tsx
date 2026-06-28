import { ShieldCheck } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function PolicyHeader() {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">
                    Later N Comix · Est. 2025
                </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-1">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">
                Your data is yours — here's exactly how we handle it.
            </p>
            <Separator className="mt-5" />
        </div>
    )
}
