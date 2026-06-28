import { Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TermsOfServiceNotice() {
    return (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs md:text-sm leading-relaxed">
                We love our community! Later N Comix is a safe space for everyone — readers and
                creators alike. Keep it creative, keep it kind, and we'll have a great time
                together! 🌟 — The Later N Comix Team 🏮
            </AlertDescription>
        </Alert>
    )
}
