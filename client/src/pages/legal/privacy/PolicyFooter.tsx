import { Info } from 'lucide-react'

export function PolicyFooter() {
    return (
        <div className="mt-8 rounded-lg border border-border bg-muted/40 px-5 py-4 flex gap-3 items-start">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground block mb-0.5">Policy Changes</span>
                If we make significant changes, we'll notify you via email or a banner on the site.
                Continued use of Later N Comix after changes means you accept the updated policy.
                Questions?{' '}
                <a
                    href="mailto:support@laterncomix.com"
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                    support@laterncomix.com
                </a>
            </div>
        </div>
    )
}
