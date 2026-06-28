import { Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function BecomeCreatorNotice() {
    return (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs md:text-sm leading-relaxed">
                We love our creators! But Later N Comix is a safe space for everyone. Uploading real
                gore, explicit content, or stolen work will get your account permanently removed —
                no warnings, no appeals. Keep it cool and we'll have a great time together! 🌟
            </AlertDescription>
        </Alert>
    )
}
