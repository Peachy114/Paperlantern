import { Link } from 'react-router-dom'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Coins, BookOpen, LogOut, ChevronRight, Bug, Settings } from 'lucide-react'

interface Props {
    token: string | null
    walletBalance?: number | string
    onLogout: () => void
    onClose: () => void
    mobile?: boolean
}

export default function ProfileLinkLists({
    token,
    walletBalance,
    onLogout,
    onClose,
    mobile = false,
}: Props) {
    if (!token) return null

    if (mobile) {
        return (
            <div className="flex flex-col">
                <Link
                    to="/credits"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 border-b text-sm hover:bg-muted/40 transition-colors"
                >
                    <Coins className="w-4 h-4" />
                    Credits — {walletBalance ?? '—'}
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Link>
                <Link
                    to="/comix"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 border-b text-sm hover:bg-muted/40 transition-colors"
                >
                    <BookOpen className="w-4 h-4" />
                    Comix
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Link>
                <Link
                    to="/settings"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 border-b text-sm hover:bg-muted/40 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    Settings
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Link>
                <Link
                    to="/tickets"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 border-b text-sm hover:bg-muted/40 transition-colors"
                >
                    <Bug className="w-4 h-4" />
                    Report
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Link>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 border-b text-sm hover:bg-muted/40 transition-colors w-full text-left"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </button>
            </div>
        )
    }

    return (
        <>
            <DropdownMenuItem asChild>
                <Link to="/credits" onClick={onClose} className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Credits — {walletBalance ?? '—'}
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
                <Link to="/settings" onClick={onClose} className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
                <Link to="/tickets" onClick={onClose} className="flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Report
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </DropdownMenuItem>
        </>
    )
}
