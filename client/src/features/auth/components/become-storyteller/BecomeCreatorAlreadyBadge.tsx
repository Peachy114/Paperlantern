import { Badge } from '@/components/ui/badge'
import { CheckCircle } from 'lucide-react'

export default function BecomeCreatorAlreadyBadge() {
    return (
        <Badge variant="secondary" className="gap-1.5 text-xs">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            You're already a storyteller
        </Badge>
    )
}
