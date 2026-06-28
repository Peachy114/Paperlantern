import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
    label: string
    to: string
}

export default function SettingRow({ label, to }: Props) {
    return (
        <Link
            to={to}
            className="flex items-center justify-between px-4 py-4 text-sm font-medium hover:bg-muted/40 transition-colors"
        >
            {label}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
    )
}
